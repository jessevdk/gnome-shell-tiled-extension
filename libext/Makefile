CFLAGS = $(shell pkg-config --cflags libmutter x11)
LIBS = $(shell pkg-config --libs libmutter x11)

all: libtiledext.so TiledExt-1.0.gir TiledExt-1.0.typelib

libtiledext.so: ext.c ext.h
	$(CC) $(CFLAGS) -Wall -Werror -shared -fPIC -o $@ $^ $(LIBS)

TiledExt-1.0.gir: libtiledext.so
	g-ir-scanner 					\
		--warn-all 				\
		--add-include-path /usr/lib/mutter 	\
		-i Meta-3.0 				\
		-L . -ltiledext 			\
		-n TiledExt 				\
		--nsversion 1.0				\
		--no-libtool 				\
		-o $@					\
		ext.c ext.h

TiledExt-1.0.typelib: TiledExt-1.0.gir
	g-ir-compiler					\
		--includedir .				\
		--includedir /usr/lib/mutter		\
		--shared-library libtiledext		\
		-o $@					\
		TiledExt-1.0.gir
