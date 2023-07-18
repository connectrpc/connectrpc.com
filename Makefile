.PHONY: build
build:
	npm run build

.PHONY: lint
lint: npmlint npmchecktypes npmprose

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

.PHONY: npmprose
npmprose:
	npm run prose

.PHONY: bufgenerate
bufgenerate:
	npm run buf:generate

