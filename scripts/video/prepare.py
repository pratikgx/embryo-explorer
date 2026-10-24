from pathlib import Path
import shutil
here = Path(__file__).resolve().parent
root = here.parents[1]
out = root / "work/walkthrough-site"
shutil.copytree(root / "dist", out, dirs_exist_ok=True)
js = (out / "home.js").read_text()
js = "const captureMode=new URLSearchParams(location.search).has('capture');\n" + js
js = js.replace("function tick(now){", "function tick(now){if(captureMode)return;", 1)
(out / "home.js").write_text(js + "\n" + (here / "capture-driver.js").read_text())
with (out / "home.css").open("a") as f: f.write("\n" + (here / "capture.css").read_text())
shutil.copy2(here / "recorder.html", out / "recorder.html")
print("Ready. Run: python3 -m http.server 8874 --directory work/walkthrough-site")
