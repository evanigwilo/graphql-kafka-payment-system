#!/bin/bash
# set -eo pipefail

host="$(hostname --ip-address || echo '127.0.0.1')"

if mongo mongodb://$MONGO_INITDB_ROOT_USERNAME:$MONGO_INITDB_ROOT_PASSWORD@$host:$MONGO_DB_PORT/$MONGO_INITDB_DATABASE?authSource=$MONGO_INITDB_ROOT_USERNAME \
	--quiet --eval 'quit(db.runCommand({ serverStatus: 1 }).ok ? 0 : 2)'; then
	exit 0
fi

exit 1
