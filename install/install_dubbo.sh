#!/usr/bin/env bash

set -e

DIR_INSTALLER=test/installer

mkdir -p $DIR_INSTALLER
cd $DIR_INSTALLER

CURRENT_DIR=`pwd`
ZOOKEEPER=$CURRENT_DIR/zookeeper-3.4.9
DUBBO=$CURRENT_DIR/dubbox

#
# zookeeper
#############################################################

# curl https://mirrors.tuna.tsinghua.edu.cn/apache/zookeeper/zookeeper-3.4.9/zookeeper-3.4.9.tar.gz --output $ZOOKEEPER.tar.gz
#
# tar xzf $ZOOKEEPER.tar.gz
#
# cd $ZOOKEEPER
#
# cat <<EOT > ./conf/zoo.cfg
# tickTime=2000
# initLimit=10
# syncLimit=5
# dataDir=$ZOOKEEPER/tmp/data
# dataLogDir=$ZOOKEEPER/tmp/log
# clientPort=2181
# server.1=localhost:2287:3387
# EOT
#
# mkdir -p $ZOOKEEPER/tmp/data
# mkdir -p $ZOOKEEPER/tmp/log
#
# bin/zkServer.sh start

#
# dubbo
#############################################################

# cd $CURRENT_DIR
#
# git clone https://github.com/dangdangdotcom/dubbox.git
#
cd $DUBBO
# mvn clean install -Dmaven.test.skip

#
# dubbo provicer
#

# DUBBO_PROVIDER=$DUBBO/dubbo-demo/dubbo-demo-provider/target
# DUBBO_PROVIDER_ASSEMBLY=$DUBBO_PROVIDER/dubbo-demo-provider-2.8.4-SNAPSHOT
#
# cd $DUBBO_PROVIDER
# tar zxf dubbo-demo-provider-2.8.4-SNAPSHOT-assembly.tar.gz
#
# cat <<EOT > $DUBBO_PROVIDER_ASSEMBLY/conf/dubbo.properties
# dubbo.container=log4j,spring
# dubbo.application.name=demo-provider
# dubbo.application.owner=
# dubbo.registry.address=zookeeper://127.0.0.1:2181
# dubbo.monitor.protocol=registry
# dubbo.protocol.name=dubbo
# dubbo.protocol.port=20880
# dubbo.service.loadbalance=roundrobin
# dubbo.log4j.file=logs/dubbo-demo-provider.log
# dubbo.log4j.level=WARN
# EOT
#
# cd $DUBBO_PROVIDER_ASSEMBLY/bin
# ./start.sh


#
# dubbo consumer
#

DUBBO_CONSUMER=$DUBBO/dubbo-demo/dubbo-demo-consumer/target
DUBBO_CONSUMER_ASSEMBLY=$DUBBO_CONSUMER/dubbo-demo-consumer-2.8.4

cd $DUBBO_CONSUMER
tar zxf dubbo-demo-consumer-2.8.4-assembly.tar.gz

cat <<EOT > $DUBBO_CONSUMER_ASSEMBLY/conf/dubbo.properties
dubbo.container=log4j,spring
dubbo.application.name=demo-consumer
dubbo.application.owner=
dubbo.registry.address=zookeeper://127.0.0.1:2181
dubbo.monitor.protocol=registry
dubbo.log4j.file=logs/dubbo-demo-consumer.log
dubbo.log4j.level=WARN
EOT

cd $DUBBO_CONSUMER_ASSEMBLY/bin
./start.sh
