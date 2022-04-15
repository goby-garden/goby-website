run eleventy
npx @11ty/eleventy

start live server:
npx @11ty/eleventy --serve


#### FFMPEG golden 1-step command for mov->scaled mp4 saved in video folder:
`for i in *.mov; do ffmpeg -i "$i" -vf "scale=1800:-1" "../processed/${i%.*}.mp4"; done`

smol:
`for i in *.mov; do ffmpeg -i "$i" -vf "scale=800:-1" "../processed/${i%.*}.mp4"; done`

single:
`ffmpeg -i "link-loop.mov" -vf "scale=1800:-1" "../processed/link-loop.mp4"`

#### FFMPEG convert videos in a folder to nicely sized good quality webm:
`for i in *.mp4; do ffmpeg -i "$i" -c:v libvpx-vp9 -crf 40 -b:v 0 -b:a 128k -c:a libopus "${i%.*}.webm"; done`

single:

`ffmpeg -i "tractatus-tabs.mp4" -c:v libvpx-vp9 -crf 40 -b:v 0 -b:a 128k -c:a libopus "tractatus-tabs.webm"`

#### FFMPEG get first frame of each mp4 in folder and save it as a jpg
`for i in *.mp4; do ffmpeg -ss 00:00:00 -i "$i" -vframes 1 -q:v 2 "${i%.*}.jpg"; done`

single:

`ffmpeg -ss 00:00:00 -i "tractatus-tabs.mp4" -vframes 1 -q:v 2 "tractatus-tabs.jpg"`


### Crossfade something with itself:

```
ffmpeg -i space-extended.mp4 -filter_complex "[0]trim=end=1,setpts=PTS-STARTPTS[begin];[0]trim=start=1,setpts=PTS-STARTPTS[end];[end][begin]xfade=fade:duration=1:offset=12,format=yuv420p" cross-extended.mp4
```
