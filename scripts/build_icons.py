#!/usr/bin/env python3
"""Generate app PNG icons deterministically (Pillow required)."""
from pathlib import Path
from PIL import Image, ImageDraw
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'icons'
OUT.mkdir(exist_ok=True)


def draw_icon(size,maskable=False):
    scale=3
    s=size*scale
    image=Image.new('RGB',(s,s),'#508a67')
    d=ImageDraw.Draw(image)
    def box(coords):return tuple(round(c*s/512) for c in coords)
    def ell(coords,fill,outline=None,width=1):d.ellipse(box(coords),fill=fill,outline=outline,width=max(1,round(width*s/512)))
    def line(coords,fill,width):d.line([box((p[0],p[1])) for p in coords],fill=fill,width=max(1,round(width*s/512)),joint='curve')
    # Keep all identifying details within the safe central area for adaptive icons.
    ell((88,93,424,424),'#f8eed1')
    ell((112,120,400,399),'#eddbb9')
    # Ant abdomen and chest; head, antennae, eyes and smile.
    ell((163,263,300,361),'#79462f')
    ell((225,268,328,356),'#925139')
    line([(226,194),(203,151),(187,150)],'#613d2d',15)
    line([(296,192),(321,151),(338,149)],'#613d2d',15)
    ell((181,138,201,158),'#ae714c')
    ell((327,136,347,156),'#ae714c')
    ell((181,170,361,338),'#a96341','#6a3d2e',9)
    ell((207,216,239,260),'#fff8e8')
    ell((292,216,324,260),'#fff8e8')
    ell((220,228,236,251),'#352925')
    ell((296,228,312,251),'#352925')
    ell((234,274,300,306),'#a96341')
    d.arc(box((233,258,304,313)),10,170,fill='#5d3829',width=max(3,round(9*s/512)))
    # Tiny carrot-shaped orange accent.
    d.polygon([box(c) for c in [(140,317),(170,315),(155,371)]],fill='#e88c38')
    line([(153,317),(148,307)],'#80a763',9)
    line([(154,317),(167,302)],'#80a763',8)
    return image.resize((size,size),Image.Resampling.LANCZOS)

for n in (192,512):
    target=OUT/f'ant-{n}.png'
    draw_icon(n).save(target,optimize=True)
    print(f'Created {target.name}')
draw_icon(512,maskable=True).save(OUT/'ant-maskable-512.png',optimize=True)
print('Created ant-maskable-512.png')
