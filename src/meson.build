
gnome_shell_cflags = [
  '-DCLUTTER_ENABLE_EXPERIMENTAL_API',
  '-DCOGL_ENABLE_EXPERIMENTAL_API',
  '-DVERSION="@0@"'.format(meson.project_version()),
  '-DLOCALEDIR="@0@"'.format(localedir),
  '-DDATADIR="@0@"'.format(datadir),
  '-DGNOME_SHELL_LIBEXECDIR="@0@"'.format(libexecdir),
  '-DGNOME_SHELL_DATADIR="@0@"'.format(pkgdatadir),
  '-DGNOME_SHELL_PKGLIBDIR="@0@"'.format(pkglibdir)
]

install_rpath = ':'.join([mutter_typelibdir, shell_typelibdir, pkglibdir])

gnome_shell_deps = [
  gjs_dep,
  clutter_dep,
  gi_dep,
  shell_dep
]

libshell_public_headers = [
  'page-handler.h'
]

libshell_private_headers = [
  'page-init.h',
  'page-box.hxx',
  'page-cairo-surface-type-name.hxx',
  'page-client-managed.hxx',
  'page-color.hxx',
  'page-config-handler.hxx',
  'page-dropdown-menu.hxx',
  'page-exception.hxx',
  'page-grab-handlers.hxx',
  'page-icon-handler.hxx',
  'page-icon.hxx',
  'page-key-desc.hxx',
  'page-notebook.hxx',
  'page-page-component.hxx',
  'page-page-exception.hxx',
  'page-page.hxx',
  'page-page-types.hxx',
  'page-popup-split.hxx',
  'page-region.hxx',
  'page-simple2-theme.hxx',
  'page-split.hxx',
  'page-theme.hxx',
  'page-theme-managed-window.hxx',
  'page-theme-notebook.hxx',
  'page-theme-split.hxx',
  'page-theme-tab.hxx',
  'page-time.hxx',
  'page-tiny-theme.hxx',
  'page-tree.hxx',
  'page-utils.hxx',
  'page-view-floating.hxx',
  'page-view-fullscreen.hxx',
  'page-view.hxx',
  'page-view-notebook.hxx',
  'page-viewport.hxx',
  'page-workspace.hxx'
]

libshell_sources = [ 
  'page-handler.cxx'
]

libshell_private_sources = [
  'page-client-managed.cxx',
  'page-config-handler.cxx',
  'page-dropdown-menu.cxx',
  'page-grab-handlers.cxx',
  'page-icon-handler.cxx',
  'page-notebook.cxx',
  'page-page-component.cxx',
  'page-page.cxx',
  'page-popup-split.cxx',
  'page-simple2-theme.cxx',
  'page-split.cxx',
  'page-tiny-theme.cxx',
  'page-tree.cxx',
  'page-utils.cxx',
  'page-view.cxx',
  'page-view-floating.cxx',
  'page-view-fullscreen.cxx',
  'page-view-notebook.cxx',
  'page-viewport.cxx',
  'page-workspace.cxx',
  'page-init.cxx'
]

#libshell_enums = gnome.mkenums_simple('page-enum-types',
#  sources: libshell_public_headers
#)

libshell_gir_sources = [
#  libshell_enums,
  libshell_public_headers,
  libshell_sources
]

libshell_no_gir_sources = [
#  js_resources,
  libshell_private_headers,
  libshell_private_sources
]

libshell = library('page-shell-extension',
  sources: libshell_gir_sources + libshell_no_gir_sources,
  dependencies: gnome_shell_deps + [mutter_dep, m_dep, shell_dep],
  c_args: gnome_shell_cflags,
  cpp_args: ['-std=c++11'] + gnome_shell_cflags,
  build_rpath: mutter_typelibdir,
  install_rpath: install_rpath,
  install_dir: pkglibdir,
  install: true
)

libshell_dep = declare_dependency(link_with: libshell)

libshell_gir_includes = [
  'Shell-0.1',
  'Clutter-@0@'.format(mutter_api_version),
  'ClutterX11-@0@'.format(mutter_api_version),
  'Meta-@0@'.format(mutter_api_version),
  'Soup-2.4'
]

gnome.generate_gir(libshell,
  sources: libshell_gir_sources,
  nsversion: '0.1',
  namespace: 'Page',
  includes: libshell_gir_includes,
  extra_args: [ ],
  dependencies: [ shell_dep ],
  install_dir_gir: pkgdatadir,
  install_dir_typelib: pkglibdir,
  install: true
)


