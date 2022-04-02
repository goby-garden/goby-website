ffmpeg -i on-black.mov -vf "fps=10,scale=1200:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -loop 0 on-black.gif


ffmpeg -i on-black.mov -loop 0 -vf  "fps=10,scale=1200:-1" on-black.gif

ffmpeg -i on-noise.mov -loop 0 -vf  "fps=10,scale=1200:-1" on-noise.gif

ffmpeg -i output.mp4 -loop 0 -vf  "fps=10,scale=1200:-1" output2.gif


ffmpeg -i output.mp4 -loop 0 -vf  "fps=10,scale=1200:-1" output2.gif

ffmpeg -i output.mp4 -loop 0 -vf "fps=10,scale=1200:-1,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse=dither=bayer" output3.gif

ffmpeg -i output.mp4 -loop 0 -vf "fps=10,scale=1200:-1,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" output3.gif

ffmpeg -i output.mp4 -loop 0 -vf "fps=10,scale=1200:-1,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse=dither=bayer" output3.gif

ffmpeg -i otherstuff.mp4 -loop 0 -vf "fps=10,scale=1200:-1,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse=dither=bayer:bayer_scale=1" otherstuff.gif


-vf  "fps=10,scale=1200:-1,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse"


ffmpeg -f concat -safe 0 -i mylist.txt -c copy otherstuff.mp4
