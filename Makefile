
all:
	meson _build --prefix=${HOME}/jhbuild/install
	ninja -v -C _build

clean:
	rm -rf _build

install:
	ninja -v -C _build install

