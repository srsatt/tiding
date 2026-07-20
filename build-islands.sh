mkdir -p public/static
rm -f public/static/islands.js public/static/islands.js.gz
rm -rf public/static/js
mkdir -p public/static/js
bun run tools/build-lucide-icons.ts
cat \
	src/frontend/styles/admin.module.css \
	src/frontend/design-system/buttons.css \
	src/frontend/design-system/fields.css \
	src/frontend/design-system/form-controls.css \
	src/frontend/design-system/icon.css \
	src/frontend/design-system/segmented-control.css \
	src/frontend/design-system/surfaces.css \
	src/frontend/design-system/tabs.css \
	src/frontend/styles/theme.css \
	src/frontend/styles/shell.css \
	src/frontend/styles/navigation.css \
	src/frontend/styles/layout.css \
	src/frontend/styles/components.css \
	src/frontend/styles/dialog.css \
	src/frontend/features/devices/devices.css \
	src/frontend/features/data-sources/data-sources.css \
	src/frontend/features/playlists/playlists.css \
	src/frontend/features/settings/render-settings.css \
	src/frontend/features/screens/screen-form.css \
	src/frontend/features/screens/screens.css \
	src/frontend/features/widgets/widget-config.css \
	src/frontend/features/custom-widgets/wizard.css \
	src/frontend/features/settings/welcome.css \
	src/frontend/features/designer/designer.css \
	src/frontend/features/designer/designer-widgets.css \
	src/frontend/features/designer/designer-palette.css \
	src/frontend/features/designer/designer-canvas.css \
	src/frontend/features/designer/designer-toolbar.css \
	src/frontend/features/designer/designer-panels.css \
	src/frontend/features/designer/designer-responsive.css \
	src/frontend/styles/responsive.css \
	> public/static/admin.css
bun build src/frontend/islands.tsx \
	--target=browser \
	--production \
	--format=esm \
	--splitting \
	--outdir public/static/js \
	--entry-naming islands.js \
	--chunk-naming 'chunks/[name]-[hash].js'
find public/static/js -type f -name "*.js" -exec gzip -9 -k -f {} \;
gzip -9 -c public/static/admin.css > public/static/admin.css.gz
