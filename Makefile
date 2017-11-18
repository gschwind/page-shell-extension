
all:
	#meson _build --prefix=${HOME}/localx --libdir=${HOME}/localx/lib
	#meson _build --prefix=${HOME}/jhbuild/install-0 --libdir=${HOME}/jhbuild/install-0/lib
	meson _build --prefix=${HOME}/.local

	ninja -v -C _build

clean:
	rm -rf _build

install:
	ninja -v -C _build install

