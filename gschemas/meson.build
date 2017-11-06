
#compiled = gnome.compile_schemas()

install_data('net.hzog.page.gschema.xml', install_dir: schemadir)

#cdata = configuration_data()
#schema = configure_file(
#  input: 'net.hzog.page.gschema.xml',
#  output: 'net.hzog.page.gschema.xml',
#  configuration: cdata)
#
#custom_target('compile-schemas',
#  input: schema,
#  output: 'gschemas.compiled',
#  command: [find_program('glib-compile-schemas'), meson.current_build_dir()],
#  build_by_default: true)

meson.add_install_script('meson_post_install.py')


