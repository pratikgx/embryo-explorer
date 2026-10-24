import numpy as np,json,pathlib,struct
from skimage.measure import marching_cubes
from scipy.interpolate import CubicSpline
from scipy.ndimage import gaussian_filter
out=pathlib.Path(__file__).resolve().parents[1]/'dist'/'illustrative';out.mkdir(exist_ok=True)
lo=np.array([-1.65,-1.65,-1.05]);hi=np.array([1.65,1.95,1.05]);shape=np.array([160,176,108]);step=(hi-lo)/(shape-1)
X,Y,Z=np.meshgrid(*[np.linspace(lo[i],hi[i],shape[i],dtype=np.float32) for i in range(3)],indexing='ij')
def ell(c,r):return (np.sqrt(((X-c[0])/r[0])**2+((Y-c[1])/r[1])**2+((Z-c[2])/r[2])**2)-1)*min(r)
def sm(a,b,k=.12):
 h=np.clip(.5+.5*(b-a)/k,0,1);return b*(1-h)+a*h-k*h*(1-h)
def union(parts,k=.09):
 a=parts[0]
 for b in parts[1:]:a=sm(a,b,k)
 return a

def tube(points,radii,samples=45):
 t=np.linspace(0,1,len(points));ts=np.linspace(0,1,samples);ps=CubicSpline(t,np.array(points))(ts);rs=np.interp(ts,t,radii);field=np.full(X.shape,10,np.float32)
 for p,r in zip(ps,rs):field=sm(field,np.sqrt((X-p[0])**2+(Y-p[1])**2+(Z-p[2])**2)-r,.05)
 return field

def save(field,ident,name,group):
 verts,faces,_,_=marching_cubes(field,0,spacing=step,allow_degenerate=False);verts+=lo
 # Correct outward face winding from signed distance gradients.
 # Marching-cubes face winding is outward for this distance field.
 filename=f'{ident}-{name}.bin';(out/filename).write_bytes(struct.pack('<II',len(verts),faces.size)+verts.astype('<f4').tobytes()+faces.astype('<u4').tobytes())
 return dict(id=name,name=name.replace('_',' '),group=group,file=filename,vertices=len(verts),triangles=len(faces),center=verts.mean(0).tolist(),bounds=[verts.min(0).tolist(),verts.max(0).tolist()])
groups={
'body':dict(name='Outer form',color='#e7bfa5',description='A smooth, original illustration of the embryo’s outer form. Hide it to explore the structures inside.'),
'neural':dict(name='Neural tube',color='#9caec4',description='An illustrative neural tube and early brain regions.'),
'heart':dict(name='Heart',color='#cc7869',description='A stylized looping embryonic heart with rounded chamber forms. It is an illustration, not a physiological simulation.'),
'somites':dict(name='Somites',color='#c7ae82',description='Paired segments arranged along the developing body axis.'),
'gut':dict(name='Gut tube',color='#83a99a',description='A simplified internal tube following the curved body plan.'),
'vessels':dict(name='Vessels',color='#af91a1',description='Illustrative paired vessels alongside the body axis.'),
'sensory':dict(name='Optic vesicles',color='#797e88',description='Subtle eye-region forms within the head.')}
stages=[]
for num,(label,curl,head,limb) in enumerate([('Early fold',.65,.72,0),('Body plan',.85,.9,.65),('Organ formation',1,1,1)]):
 ident=f'form{num+1}';parts=[]
 spine=[[-.42,1.08,0],[-.76,.55,0],[-.78,-.12,0],[-.55,-.72,0],[.05,-1.02,0],[.63,-.81,0],[.88,-.51,0]]
 spine=np.array(spine);spine[4:,0]*=curl;spine[4:,1]-=(1-curl)*.45
 outer=tube(spine,[.42,.42,.39,.31,.19,.105,.025])
 headparts=[ell([-.36,1.05,0],[.55*head,.62*head,.49*head]),ell([.05,1.18,0],[.47*head,.52*head,.45*head]),ell([.36,.87,0],[.36*head,.37*head,.36*head]),ell([.32,.56,0],[.25*head,.24*head,.3*head])]
 outer=union([outer]+headparts,.19)
 # Thoracic prominence and smooth limb buds.
 outer=sm(outer,ell([-.15,.05,0],[.43,.45,.37]),.2)
 if limb:
  for sign in [-1,1]:
   outer=sm(outer,ell([-.24,-.03,sign*.4],[.23*limb,.2*limb,.19*limb]),.12)
   outer=sm(outer,ell([-.36,-.64,sign*.29],[.18*limb,.19*limb,.17*limb]),.1)
 # Shallow optic dimples, with separate smooth vesicles visible within them.
 for sign in [-1,1]:
  eye=[.24,.92,sign*.385*head]
  cut=ell(eye,[.115*head,.13*head,.1*head]);outer=np.maximum(outer,-cut)
 parts.append(save(outer,ident,'outer_form','body'))
 neural=tube(spine[:-1]+np.array([-.035,.015,0]),[.19,.145,.125,.1,.065,.025])
 neural=union([neural,ell([-.36,1.13,0],[.34*head,.42*head,.31*head]),ell([.06,1.22,0],[.3*head,.33*head,.29*head])],.12)
 parts.append(save(neural,ident,'neural_tube','neural'))
 heart=tube([[-.08,.3,.06],[.08,.25,.04],[.24,.08,.1],[.15,-.12,.2],[-.08,-.13,.2],[-.22,.05,.13],[-.13,.16,.04]],[.045,.075,.1,.12,.1,.075,.04],45)
 heart=sm(heart,ell([.11,-.09,.2],[.16,.14,.12]),.035)
 heart=sm(heart,ell([-.13,.16,.05],[.09,.09,.08]),.03)
 parts.append(save(heart,ident,'heart','heart'))
 som=[]
 path=CubicSpline(np.linspace(0,1,len(spine)),spine)(np.linspace(.2,.67,9))
 for n,p in enumerate(path):
  for sign in [-1,1]:som.append(ell([p[0]-.02,p[1],sign*(.23-n*.011)],[.105-n*.003,.065,.09-n*.003]))
 parts.append(save(union(som,.025),ident,'somites','somites'))
 gut=tube([[-.24,.54,0],[-.38,.12,0],[-.37,-.35,0],[-.07,-.67,0],[.34,-.7,0]],[.075,.07,.07,.055,.03])
 parts.append(save(gut,ident,'gut_tube','gut'))
 ves=[]
 for sign in [-1,1]:
  ps=spine[1:-1].copy();ps[:,0]+=.1;ps[:,2]=sign*.12
  ves.append(tube(ps,[.026,.027,.023,.02,.014],32))
 parts.append(save(union(ves,.015),ident,'paired_vessels','vessels'))
 eyes=[]
 for sign in [-1,1]:eyes.append(ell([.24,.92,sign*.385*head],[.088*head,.103*head,.065*head]))
 parts.append(save(union(eyes,.01),ident,'optic_vesicles','sensory'))
 stages.append(dict(id=ident,age=label,ts=num+1,species='Illustrative mammalian embryo',parts=parts))
 print(ident,sum(p['triangles'] for p in parts),'triangles',flush=True)
(out/'manifest.json').write_text(json.dumps(dict(groups=groups,stages=stages),indent=2))
