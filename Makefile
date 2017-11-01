
all:
	meson _build
	ninja -v -C _build

clean:
	rm -rf _build


