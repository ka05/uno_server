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

Make sure it never crashes
http://engineering.fluencia.com/blog/2013/12/20/the-4-keys-to-100-uptime-with-nodejs


Fix Issues
-quitting game ( other use cases )
  -refreshing browser
  -navigating elsewhere
  - ...
  


TODO:
- deal with stopping all necessary intervals after leaving game room

- try adding more players ( checkbox for selecting players to challenge )

BUGS:
- firefox not seeing "io"