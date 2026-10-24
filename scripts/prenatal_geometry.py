"""Original illustrative human prenatal surfaces; no specimen geometry is used.
Requires numpy, scipy, scikit-image. Ages and limitations are in anatomy-matrix.md.
"""
import json, pathlib, struct, sys
import numpy as np
from scipy.ndimage import gaussian_filter
from skimage.measure import marching_cubes

OUT = pathlib.Path(__file__).resolve().parents[1] / 'dist' / 'prenatal'
OUT.mkdir(exist_ok=True)
lo=np.array([-1.4,-1.55,-1.0],dtype=np.float32)
hi=np.array([1.5,1.95,1.0],dtype=np.float32)
shape=np.array([144,176,104]); step=(hi-lo)/(shape-1)
X,Y,Z=np.meshgrid(*[np.linspace(lo[i],hi[i],shape[i],dtype=np.float32) for i in range(3)],indexing='ij')

def ell(c,r):
    return (np.sqrt(((X-c[0])/r[0])**2+((Y-c[1])/r[1])**2+((Z-c[2])/r[2])**2)-1)*min(r)

def sm(a,b,k=.1):
    h=np.clip(.5+.5*(b-a)/k,0,1)
    return b*(1-h)+a*h-k*h*(1-h)

def segment(a,b,ra,rb):
    v=np.array(b)-a; d=v@v
    t=np.clip(((X-a[0])*v[0]+(Y-a[1])*v[1]+(Z-a[2])*v[2])/d,0,1)
    return np.sqrt((X-a[0]-t*v[0])**2+(Y-a[1]-t*v[1])**2+(Z-a[2]-t*v[2])**2)-(ra+(rb-ra)*t)

def path(ps,rs,k=.06):
    f=segment(ps[0],ps[1],rs[0],rs[1])
    for i in range(1,len(ps)-1): f=sm(f,segment(ps[i],ps[i+1],rs[i],rs[i+1]),k)
    return f

def save(field,name):
    field=gaussian_filter(field,.55)
    v,f,normals,_=marching_cubes(field,0,spacing=step,allow_degenerate=False)
    # Gradient normals avoid skinny-triangle shading artifacts from area averaging.
    normals=normals/step
    normals/=np.maximum(np.linalg.norm(normals,axis=1,keepdims=True),1e-8)
    face_normals=np.cross(v[f[:,1]]-v[f[:,0]],v[f[:,2]]-v[f[:,0]])
    if np.sum(face_normals*normals[f[:,0]])<0: normals=-normals
    v+=lo
    (OUT/(name+'.bin')).write_bytes(struct.pack('<II',len(v),f.size)+v.astype('<f4').tobytes()+f.astype('<u4').tobytes()+normals.astype('<f4').tobytes())
    print(name,len(v),'vertices',flush=True)

def embryo(stage):
    # Sagittal C-shaped body; x anterior, z left/right.
    if stage==5:
        spine=[[-.1,.98,0],[-.48,.58,0],[-.58,.0,0],[-.45,-.56,0],[-.12,-1.02,0]]
        f=path(spine,[.24,.22,.19,.16,.045],.1)
        f=sm(f,ell([-.05,.96,0],[.36,.42,.28]),.12)
        f=sm(f,ell([-.27,.06,0],[.31,.36,.22]),.12)
        f=sm(f,ell([.04,.08,0],[.27,.28,.25]),.14)
        # Open cranial neural-fold impression (not a mature brain).
        f=np.maximum(f,-ell([-.19,1.14,0],[.12,.32,.105]))
        return f
    h=.87 if stage==6 else 1
    spine=[[-.38,1.0,0],[-.66,.5,0],[-.66,-.05,0],[-.45,-.6,0],[.02,-.9,0],[.43,-.74,0]]
    if stage==7: spine[-1]=[.13,-.77,0]
    f=path(spine,[.36,.35,.32,.27,.13,.025 if stage==6 else .08],.13)
    for c,r in [([-.22,1.03,0],[.55*h,.57*h,.43*h]),([.19,.85,0],[.34,.37,.32]),([-.03,-.06,0],[.38,.46,.32])]: f=sm(f,ell(c,r),.14)
    for s in [-1,1]:
        if stage==6:
            f=sm(f,ell([-.03,-.03,s*.34],[.18,.15,.2]),.07)
            f=sm(f,ell([-.28,-.56,s*.25],[.14,.14,.15]),.06)
        else:
            f=sm(f,path([[-.05,.14,s*.31],[.31,-.15,s*.4],[.47,.11,s*.32]],[.13,.1,.085]),.09)
            f=sm(f,ell([.49,.19,s*.3],[.13,.15,.07]),.05)
            for j in range(5):
                f=sm(f,path([[.48+j*.026,.23,s*(.26+j*.02)],[.48+j*.026,.34-(j-2)**2*.012,s*(.26+j*.02)]],[.022,.016],.01),.014)
            f=sm(f,path([[-.18,-.56,s*.23],[.28,-.62,s*.31],[.21,-.96,s*.32]],[.15,.12,.08]),.08)
            f=sm(f,ell([.33,-.99,s*.32],[.18,.075,.1]),.04)
        f=np.maximum(f,-ell([.29,.86,s*.29],[.1,.1,.07]))
    return f

def fetus(ga):
    t=(ga-12)/28; fat=max(0,(ga-24)/16)
    # Different proportions and posture as well as size: larger early head,
    # extending trunk/limbs, later fat deposition and stronger fetal flexion.
    h=1.14-.22*t
    head=np.array([-.13,.95,0]); jaw=np.array([.16,.60,0])
    f=ell(head,[.56*h,.62*h,.46*h])
    for c,r,k in [([-.25,.43,0],[.28,.36,.27],.18),([-.34,-.13,0],[.31+.06*t+.05*fat,.66+.06*t,.30+.035*fat],.18),([-.08,-.40,0],[.32+.07*t+.05*fat,.43,.33+.045*fat],.18),([-.28,-.75,0],[.31,.25,.29],.12),(jaw,[.36,.33,.33],.16),([.39,.62,0],[.15,.17,.205],.07),([.48,.78,0],[.09,.095,.10],.065),([.40,.42,0],[.13,.11,.21],.08)]:
        f=sm(f,ell(c,r),k)
    for s in [-1,1]:
        shoulder=[-.12,.20,s*(.31+.02*fat)]
        elbow=[.30+.12*t,-.14+.13*t,s*(.45+.02*fat)]
        wrist=[.45,.25+.12*t,s*.36]
        palm=[.48,.34+.12*t,s*.31]
        f=sm(f,path([shoulder,elbow,wrist,palm],[.11+.04*t+.025*fat,.085+.03*t+.02*fat,.06+.015*t+.018*fat,.09+.022*fat],.055),.11)
        f=sm(f,ell(palm,[.13,.12,.075+.02*fat]),.04)
        # Curled, individually resolved fingers; no adult-sized hands.
        for j in range(4):
            z=s*(.25+j*.043); y=palm[1]+.035
            f=sm(f,path([[.48,y,z],[.57,y+.05,z],[.60,y-.015,z]],[.03+.004*fat,.027,.022],.017),.02)
        f=sm(f,path([[.43,palm[1]-.04,s*.38],[.52,palm[1]-.07,s*.36]],[.043,.03]),.04)
        hip=[-.22,-.66,s*.25]; knee=[.51+.08*t,-.46+.08*t,s*(.32+.05*t)]
        ankle=[.26,-1.04+.08*t,s*(.35+.03*t)]
        f=sm(f,path([hip,knee,ankle],[.15+.06*t+.035*fat,.12+.035*t+.025*fat,.085+.02*fat],.08),.12)
        f=sm(f,ell([.40,-1.07+.08*t,s*(.36+.03*t)],[.24,.09+.02*fat,.12+.015*fat]),.06)
        for j in range(5):
            f=sm(f,ell([.59-abs(j-1)*.014,-1.055+.08*t,s*(.27+j*.043)],[.065,.04,.027]),.016)
        # Ear pinna integrated with scalp; inset eye regions.
        f=sm(f,ell([-.03,.74,s*.425*h],[.105,.155,.055]),.03)
        f=np.maximum(f,-ell([-.005,.76,s*.467*h],[.055,.09,.025]))
        f=sm(f,ell([.25,.84,s*.18],[.17,.15,.15]),.09)
        f=sm(f,ell([.29,.63,s*.18],[.16,.16,.16]),.09)
        f=np.maximum(f,-ell([.424,.85,s*.18],[.037,.012,.072]))
    # Quiet facial definition and umbilical depression.
    f=np.maximum(f,-ell([.505,.505,0],[.035,.018,.105]))
    f=np.maximum(f,-ell([.35,-.37,0],[.05,.055,.055]))
    return f

if __name__=='__main__':
    requested=set(sys.argv[1:])
    for stage in [5,6,7]:
        if not requested or str(stage) in requested: save(embryo(stage),f'body-{stage}')
    for i,ga in enumerate([12,16,20,24,28,32,36,40],8):
        if not requested or str(i) in requested: save(fetus(ga),f'body-{i}')
