# polygonsjs
ILM Bench project: Failed attempt at making a rendering engine for WebGL
![alt tag](https://raw.githubusercontent.com/zackpudil/polygonsjs/master/screenshot.png)

# build

Install package dependencies
```
npm install
```

Build contents into /app.js file
```
gulp build
```

Host content via http-server npm package
```
npm install -g http-server
http-server /path/to/project/root
```

#how to play
desktop - use scroll to rotate camera, use w to move guy forward.  Click mouse while looking at other guy to switch to him (he should be green).

mobile - use device orientation to look around, tap screen to move guy forward.  Tap screen while looking at other guy to switch to him.

vr - same as mobile.  To render for VR press google cardboard icon at top left of screen.
