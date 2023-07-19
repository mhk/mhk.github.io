#!/bin/bash

# Start the first process
/opt/couchdb/bin/couchdb &

# Start the second process the webserver
# development
/usr/bin/python3 -m http.server --directory=/public 80 &
# /usr/sbin/nginx -g 'daemon off;' -c /public/nginx.conf &
# production
# /usr/sbin/nginx -c /public/nginx.conf &

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $?
