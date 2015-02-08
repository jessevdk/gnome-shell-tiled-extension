#ifndef __TILED_EXT_H__
#define __TILED_EXT_H__

#include <meta/window.h>

typedef struct _TiledExtSizeConstraints TiledExtSizeConstraints;

GType tiled_ext_size_constraints_get_type (void);

TiledExtSizeConstraints *tiled_ext_store_size_constraints (MetaWindow *window);
void tiled_ext_restore_size_constraints (MetaWindow *window, TiledExtSizeConstraints *constraints);

void tiled_ext_set_size_constraints (MetaWindow *window,
                                     gint        min_width,
                                     gint        min_height,
                                     gint        max_width,
                                     gint        max_height);

#endif /* __TILED_EXT_H__ */
