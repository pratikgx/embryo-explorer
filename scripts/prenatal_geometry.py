"""Original illustrative human prenatal surfaces; no specimen geometry is used.
Requires numpy, scipy, scikit-image. Ages and limitations are in anatomy-matrix.md.
"""
import json, pathlib, struct, sys
import numpy as np
from scipy.ndimage import gaussian_filter, map_coordinates
from skimage.measure import marching_cubes

OUT = pathlib.Path(__file__).resolve().parents[1] / 'dist' / 'prenatal'
OUT.mkdir(exist_ok=True)
lo=np.array([-1.4,-1.55,-1.0],dtype=np.float32)
hi=np.array([1.5,1.95,1.0],dtype=np.float32)
shape=np.array([216,264,152]); step=(hi-lo)/(shape-1)
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
    h=1.12-.18*t
    f=ell([-.13,1.00,0],[.52*h,.53*h,.455*h])
    # Continuous cranial, facial and body volumes; cheeks fill out later.
    for c,r,k in [
        ([-.24,.45,0],[.255,.32,.255],.16),
        ([-.34,-.13,0],[.31+.06*t+.05*fat,.66+.06*t,.30+.035*fat],.18),
        ([-.08,-.40,0],[.32+.07*t+.05*fat,.43,.33+.045*fat],.18),
        ([-.28,-.75,0],[.31,.25,.29],.12),
        ([.12,.72,0],[.30,.36,.32],.14),
        ([.13,.91,0],[.29,.29,.325],.12),
        ([.28,.48,0],[.19,.135,.22],.10),
        ([.38,.79,0],[.095,.15,.085],.065),
        ([.482,.731,0],[.078,.068,.087],.055),
        ([.46,.593,0],[.065,.030,.105],.035),
        ([.47,.557,0],[.064,.030,.10],.027),
    ]: f=sm(f,ell(c,r),k)
    arms=[]; legs=[]
    for side in [-1,1]:
        s=side
        shoulder=[-.13,.22,s*(.31+.02*fat)]
        elbow=[.33+.07*t, -.11 if s==1 else .02, s*(.45+.02*fat)]
        wrist=[.43,.10 if s==1 else .31,s*.29]
        palm=[.45,.18 if s==1 else .38,s*.245]
        arms.append([shoulder,elbow,wrist])
        f=sm(f,path([shoulder,elbow,wrist,palm],[.105+.035*t+.025*fat,.08+.025*t+.02*fat,.056+.015*t+.014*fat,.079+.017*fat],.055),.10)
        f=sm(f,ell(palm,[.105,.095,.074+.012*fat]),.04)
        for j in range(4):
            z=s*(.18+j*.043); y=palm[1]+.038
            finger=[[.46,y,z],[.52,y+.07-(j-1.5)**2*.009,z],[.56,y+.065-(j-1.5)**2*.009,z],[.575,y+.025,z]]
            f=sm(f,path(finger,[.026,.024,.022,.019],.009),.018)
        f=sm(f,path([[.45,palm[1]-.03,s*.30],[.54,palm[1]-.015,s*.315],[.57,palm[1]+.022,s*.295]],[.034,.028,.022],.013),.027)
        hip=[-.22,-.66,s*.25]; knee=[.51+.08*t,-.46+.08*t+(s==1)*.025,s*(.32+.05*t)]
        ankle=[.26,-1.04+.08*t+(s==1)*.045,s*(.35+.03*t)]
        legs.append([hip,knee,ankle])
        f=sm(f,path([hip,knee,ankle],[.15+.06*t+.035*fat,.12+.035*t+.025*fat,.075+.02*fat],.075),.11)
        fy=-1.065+.08*t+(s==1)*.045
        f=sm(f,ell([.39,fy,s*(.35+.03*t)],[.21,.085+.02*fat,.116+.012*fat]),.055)
        for j in range(5):
            f=sm(f,ell([.57-abs(j-1)*.012,fy+.015,s*(.27+j*.043)],[.068-j*.006,.031-j*.002,.026-j*.002]),.011)
        # Rounded cheek, closed lid mound and small pinna, blended into scalp.
        f=sm(f,ell([.265,.652,s*.19],[.18+.025*fat,.155+.02*fat,.158]),.085)
        f=sm(f,ell([.335,.847,s*.185],[.071,.060,.105]),.045)
        earz=s*.421*h
        f=sm(f,ell([-.055,.785,earz],[.077,.118,.043]),.035)
        f=np.maximum(f,-ell([-.035,.792,earz+s*.030],[.040,.066,.023]))
        f=sm(f,path([[-.055,.727,earz+s*.038],[-.087,.784,earz+s*.042],[-.065,.837,earz+s*.037]],[.014,.016,.014],.012),.018)
        f=np.maximum(f,-ell([.535,.701,s*.037],[.016,.012,.018]))
    # Subtle closed mouth and navel; no deep hollow facial cuts.
    f=np.maximum(f,-ell([.529,.575,0],[.018,.007,.085]))
    f=np.maximum(f,-ell([.35,-.37,0],[.025,.03,.028]))
    # Place eyelid and mouth details directly on the implicit surface.
    def front(y,z):
        xs=np.linspace(.1,.7,100);points=np.array([(xs-lo[0])/step[0],np.full(100,(y-lo[1])/step[1]),np.full(100,(z-lo[2])/step[2])])
        vals=map_coordinates(f,points,order=1);cross=np.where((vals[:-1]<0)&(vals[1:]>=0))[0]
        if not len(cross): return .4
        j=cross[-1];return float(xs[j]+(xs[j+1]-xs[j])*(-vals[j])/(vals[j+1]-vals[j]))
    lids=[]
    for side in [-1,1]:
        pts=[]
        for d in np.linspace(-.073,.073,15):
            y=.834+.012*(d/.073)**2;z=side*.185+d;pts.append([front(y,z)+.001,y,z])
        lids.append(pts)
    lips=[]
    for z in np.linspace(-.08,.08,17):
        y=.576+.004*(z/.08)**2;lips.append([front(y,z)+.001,y,z])
    meta=dict(eyelids=lids,mouth=lips,arms=arms,legs=legs)
    (OUT/f'details-{8+int((ga-12)/4)}.json').write_text(json.dumps(meta))
    return f

if __name__=='__main__':
    requested=set(sys.argv[1:])
    for stage in [5,6,7]:
        if not requested or str(stage) in requested: save(embryo(stage),f'body-{stage}')
    for i,ga in enumerate([12,16,20,24,28,32,36,40],8):
        if not requested or str(i) in requested: save(fetus(ga),f'body-{i}')
