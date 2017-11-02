
all:
	#meson _build --prefix=${HOME}/jhbuild/install
	meson _build --prefix=${HOME}/jhbuild/install --libdir=${HOME}/jhbuild/install/lib
	ninja -v -C _build

clean:
	rm -rf _build

install:
	ninja -v -C _build install

