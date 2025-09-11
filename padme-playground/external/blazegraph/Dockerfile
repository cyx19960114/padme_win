FROM openjdk:19

WORKDIR /workdir/data

# This uses the latest available version of Blazegraph which is the 2.1.6 RC (Release Candidate) 
ARG BLAZEGRAPH_URL=https://github.com/blazegraph/database/releases/download/BLAZEGRAPH_2_1_6_RC/blazegraph.jar 

#Fetch Blazegraph from the release page
RUN curl -k -L -s ${BLAZEGRAPH_URL} > /workdir/blazegraph.jar

EXPOSE 9999/tcp
LABEL version="latest"

CMD java -Dfile.encoding=UTF-8 -Dsun.jnu.encoding=UTF-8 -server -Xmx4g -jar /workdir/blazegraph.jar