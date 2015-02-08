#include "ext.h"
#include <X11/Xlib.h>
#include <X11/Xutil.h>
#include <meta/window.h>
#include <meta/display.h>

struct _TiledExtSizeConstraints
{
	XSizeHints *hints;
};

static TiledExtSizeConstraints *
tiled_ext_size_constraints_copy (TiledExtSizeConstraints *constraints)
{
	TiledExtSizeConstraints *ret;

	if (!constraints)
	{
		return NULL;
	}

	ret = g_slice_new0 (TiledExtSizeConstraints);

	ret->hints = XAllocSizeHints ();
	*(ret->hints) = *(constraints->hints);

	return ret;
}

static void
tiled_ext_size_constraints_free (TiledExtSizeConstraints *constraints)
{
	if (!constraints) {
		return;
	}

	XFree (constraints->hints);
	g_slice_free (TiledExtSizeConstraints, constraints);
}

G_DEFINE_BOXED_TYPE (TiledExtSizeConstraints,
                     tiled_ext_size_constraints,
                     tiled_ext_size_constraints_copy,
                     tiled_ext_size_constraints_free);

/**
 * tiled_ext_store_size_constraints:
 * @window: a #MetaWindow.
 *
 * Returns: (transfer full): the size constraints.
 */
TiledExtSizeConstraints *
tiled_ext_store_size_constraints (MetaWindow *window)
{
	TiledExtSizeConstraints *ret;
	MetaDisplay *md;
	Display *d;
	Window w;
	long retval;

	if (!META_IS_WINDOW (window))
	{
		return NULL;
	}

	md = meta_window_get_display (window);

	if (!md)
	{
		return NULL;
	}

	d = meta_display_get_xdisplay (md);

	if (!d)
	{
		return NULL;
	}

	w = meta_window_get_xwindow (window);

	if (!w)
	{
		return NULL;
	}

	ret = g_slice_new0 (TiledExtSizeConstraints);
	ret->hints = XAllocSizeHints ();

	XGetWMNormalHints(d, w, ret->hints, &retval);
	return ret;
}

void
tiled_ext_restore_size_constraints (MetaWindow              *window,
                                    TiledExtSizeConstraints *constraints)
{
	MetaDisplay *md;
	Display *d;
	Window w;

	if (!META_IS_WINDOW (window) || !constraints)
	{
		return;
	}

	md = meta_window_get_display (window);

	if (!md)
	{
		return;
	}

	d = meta_display_get_xdisplay (md);

	if (!d)
	{
		return;
	}

	w = meta_window_get_xwindow (window);

	if (!w)
	{
		return;
	}

	XSetWMNormalHints (d, w, constraints->hints);
}

void tiled_ext_set_size_constraints (MetaWindow *window,
                                     gint        min_width,
                                     gint        min_height,
                                     gint        max_width,
                                     gint        max_height)
{
	Display *d;
	Window w;
	XSizeHints *hints;

	if (!META_IS_WINDOW (window))
	{
		return;
	}

	d = meta_display_get_xdisplay (meta_window_get_display (window));
	w = meta_window_get_xwindow (window);

	hints = XAllocSizeHints ();

	hints->flags = PMinSize | PMaxSize;

	hints->min_width = min_width;
	hints->max_width = max_width;
	hints->min_height = min_height;
	hints->max_height = max_height;

	XSetWMNormalHints (d, w, hints);

	XFree (hints);
}
