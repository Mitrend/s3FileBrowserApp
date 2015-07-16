GIT_TAG := $(shell git describe --exact-match --tags HEAD)

package:
	rm -rf node_modules
	rm -rf artifacts

	npm install

	mkdir -p artifacts
	VERSION=$(git rev-parse --short HEAD)
	echo ${VERSION} > version.txt

	7z a artifacts/s3FileBrowserApp.zip *.js *.sh *.jade *.pac node_modules server client
	cp s3FileBrowserApp-setup.sh artifacts

	if [ -n "$(GIT_TAG)" ]; then cp artifacts/s3FileBrowserApp.zip artifacts/s3FileBrowserApp_$(shell date +"%Y_%m_%d_%H_%M_%S")_$(GIT_TAG).zip; fi