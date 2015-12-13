# WAD UNO
Multiplayer UNO Web App for Web Application Development Class at RIT

# Development workflow

## Enter following git aliases in shell

git config --global alias.co checkout
git config --global alias.ci commit
git config --global alias.st status
git config --global alias.br branch

## Make changes then commit, pull, push

git ci -m "commit msg"

git pull origin HEAD:master

git push origin HEAD:master



TEMP NOTES:

Advanced svg guide
https://hacks.mozilla.org/2014/11/interact-js-for-drag-and-drop-resizing-and-multi-touch-gestures/

Make sure it never crashes
http://engineering.fluencia.com/blog/2013/12/20/the-4-keys-to-100-uptime-with-nodejs


BUGS:
- firefox not seeing "io" all the time
- minor css issues:
  - chat div
  
Issues:
- enter keypress on signup ( show loading msg )
- Looks terrible on mobile ( too high res )

Optimization
- handle runaway event handlers
- inAGame prop fix ( not reset at proper times )
- handle navigating away from game ( lobby, profile, etc. )


Use Forever.js 
- https://www.npmjs.com/package/forever
