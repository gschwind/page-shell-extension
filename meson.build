project('page-shell-extension', ['c', 'cpp'],
  version: '3.27.1',
  meson_version: '>= 0.42.0',
  license: 'GPLv2+',
  default_options: ['cpp_std=c++11']
)

# We depend on a specific version of the libmutter API. The mutter variants of
# the Cogl and Clutter libraries also use this API version.
mutter_api_version = '1'

clutter_pc = 'page-mutter-clutter-' + mutter_api_version
cogl_pc = 'page-mutter-cogl-' + mutter_api_version
cogl_pango_pc = 'page-mutter-cogl-pango-' + mutter_api_version
libmutter_pc = 'libpage-mutter-' + mutter_api_version

croco_req = '>= 0.6.8'
ecal_req = '>= 3.5.3'
eds_req = '>= 3.17.2'
gcr_req = '>= 3.7.5'
gdesktop_req = '>= 3.7.90'
gio_req = '>= 2.53.0'
gi_req = '>= 1.49.1'
gjs_req = '>= 1.47.0'
gtk_req = '>= 3.15.0'
json_glib_req = '>= 0.13.2'
mutter_req = '>= 3.22.0'
polkit_req = '>= 0.100'
schemas_req = '>= 3.21.3'
startup_req = '>= 0.11'

bt_req = '>= 3.9.0'
gst_req = '>= 0.11.92'
nm_req = '>= 0.9.8'
secret_req = '>= 0.18'

gnome = import('gnome')
i18n  = import('i18n')

prefix = get_option('prefix')

bindir = join_paths(prefix, get_option('bindir'))
datadir = join_paths(prefix, get_option('datadir'))
libdir = join_paths(prefix, get_option('libdir'))
libexecdir = join_paths(prefix, get_option('libexecdir'))
mandir = join_paths(prefix, get_option('mandir'))
sysconfdir = join_paths(prefix, get_option('sysconfdir'))
includedir = join_paths(prefix, get_option('includedir'))

pkgdatadir = join_paths(datadir, 'page-shell')
pkglibdir = join_paths(libdir, 'page-shell')

convertdir = join_paths(datadir, 'GConf', 'gsettings')
desktopdir = join_paths(datadir, 'applications')
ifacedir = join_paths(datadir, 'dbus-1', 'interfaces')
localedir = join_paths(datadir, 'locale')
mozplugindir = join_paths(libdir, 'mozilla', 'plugins')
portaldir = join_paths(datadir, 'xdg-desktop-portal', 'portals')
schemadir = join_paths(datadir, 'glib-2.0', 'schemas')
servicedir = join_paths(datadir, 'dbus-1', 'services')

plugindir = get_variable('BROWSER_PLUGIN_DIR', mozplugindir)

keybindings_dep = dependency('gnome-keybindings', required: false)
if keybindings_dep.found()
  keysdir = keybindings_dep.get_pkgconfig_variable('keysdir')
else
  keysdir = join_paths(datadir, 'gnome-control-center', 'keybindings')
endif

gi_dep = dependency('gobject-introspection-1.0', version: gi_req)
gjs_dep = dependency('gjs-1.0', version: gjs_req)
clutter_dep = dependency(clutter_pc, version: mutter_req)
mutter_dep = dependency(libmutter_pc, version: mutter_req)
shell_dep = dependency('libpage-shell', version: mutter_req)
schemas_dep = dependency('gsettings-desktop-schemas', version: schemas_req)


mutter_typelibdir = mutter_dep.get_pkgconfig_variable('typelibdir')
shell_typelibdir = shell_dep.get_pkgconfig_variable('typelibdir')
python = find_program('python3')

cc = meson.get_compiler('c')
cpp = meson.get_compiler('cpp')

m_dep = cc.find_library('m', required: false)

cdata = configuration_data()
cdata.set('PKGDATADIR', pkgdatadir)
configure_file(
  input:  'page.conf.in',
  output: 'page.conf',
  configuration: cdata,
  install_dir: pkgdatadir
)


conf_inc = include_directories('.')

#subdir('js')
subdir('src')
subdir('page-shell@hzog.net')
subdir('gschemas')
subdir('page-data')
#subdir('data')
#subdir('tests')

