.PHONY: build
build:
	npm run build

.PHONY: lint
lint: npmlint npmchecktypes

.PHONY: format
format:
	npm run format

.PHONY: fix
fix: format
	npm run lint:fix

.PHONY: install
install:
	npm install

.PHONY: run
run:
	npm run start

.PHONY: publish
publish:
	$(MAKE) install
	$(MAKE) lint
	$(MAKE) build

.PHONY: npmlint
npmlint:
	npm run lint

.PHONY: npmchecktypes
npmchecktypes:
	npm run check:types

.PHONY: licenseheader
licenseheader:
	npm run license-header

.PHONY: ci
ci: build fix lint licenseheader
