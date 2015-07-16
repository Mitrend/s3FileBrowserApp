# LOCAL PARAMS
APPNAME=s3FileBrowserApp
OWNER=portal
APP_DIR=/mnt/md0/$APPNAME
LOG_DIR=/mnt/md0/logs/$APPNAME
FRONTEND_CONFIG_DIR=/mnt/md0/$APPNAME/build/js/

# S3 PARAMS
ARTIFACT_BUCKET=$(cat /mnt/bucket)

ARTIFACT_PATH=builds/$APPNAME/$APPNAME.zip

echo "---------------"
echo "---> SETUP <---"
echo "---------------"
echo "Creating directories $APP_DIR and $LOG_DIR"
mkdir -p $APP_DIR
mkdir -p $LOG_DIR
echo "Cleaning $APP_DIR/*"
rm -rf $APP_DIR/*

echo "---------------------------"
echo "---> DOWNLOAD ARTIFACT <---"
echo "---------------------------"
aws s3 cp s3://$ARTIFACT_BUCKET/$ARTIFACT_PATH $APP_DIR/artifact.zip
ls -al $APP_DIR

echo "----------------"
echo "---> UNPACK <---"
echo "----------------"
unzip -q $APP_DIR/artifact.zip -d $APP_DIR/
ls -al $APP_DIR

echo "-------------------------"
echo "---> CHOWN TO USER <---"
echo "-------------------------"
chown -R $OWNER $APP_DIR
chown -R $OWNER $LOG_DIR
ls -al $APP_DIR

echo "-------------------"
echo "---> START APP <---"
echo "-------------------"

FID="$APPNAME"
LOG_FILE=$LOG_DIR/$APPNAME.log

su -s "/bin/bash" -c "$APP_DIR/node_modules/forever/bin/forever stop $FID" portal
su -s "/bin/bash" -c "$APP_DIR/node_modules/forever/bin/forever --sourceDir $APP_DIR start --uid $FID -o $LOG_FILE -e $LOG_FILE -a -l $LOG_DIR/forever.log app.js" portal
