import subprocess
BEAT=60/127.9; BAR=4*BEAT; S0=37.95-3*BAR  # song start of cut A
# settled windows in desktop_split.mp4 (video time): theme -> start
W={'Hackerman':1.6,'Tokyo Night':10.8,'Catppuccin Latte':17.8,'Gruvbox':25.2,
   'Rose Pine':32.4,'Retro 82':40.5,'White':47.2,'Vantablack':54.2}
used={k:0.0 for k in W}
slots=[('Hackerman',BAR)]
slots+=[(t,BEAT) for t in ['Tokyo Night','Catppuccin Latte','Gruvbox','Rose Pine']]
slots+=[(t,BEAT/2) for t in ['Retro 82','White','Vantablack','Catppuccin Latte','Gruvbox','Rose Pine','Tokyo Night','Hackerman']]
# frame-exact boundaries on a 60 fps grid
fps=60; parts=[]; t=0.0
for i,(th,d) in enumerate(slots):
    a=round(t*fps); b=round((t+d)*fps); n=b-a; t+=d
    st=W[th]+used[th]; used[th]+=n/fps
    parts.append(f"[0:v]trim=start={st:.4f}:duration={n/fps:.4f},setpts=PTS-STARTPTS,scale=1920:1080:flags=lanczos,fps=60[v{i}]")
fc=";".join(parts)+";"+"".join(f"[v{i}]" for i in range(len(slots)))+f"concat=n={len(slots)}:v=1:a=0[v]"
subprocess.run(['ffmpeg','-v','error','-y','-i','desktop_split.mp4','-ss',f'{S0:.4f}','-t',f'{t:.4f}','-i','../../music/Wobble Party.mp3',
  '-filter_complex',fc,'-map','[v]','-map','1:a','-c:v','libx264','-crf','16','-preset','slow','-pix_fmt','yuv420p','-c:a','aac','-b:a','256k','opener_A.mp4'],check=True)
print(f"opener {t:.3f}s from song {S0:.3f}")
