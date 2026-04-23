# Vacu — build & push Docker image to the private registry.
#
# Quick start:
#   make login     # one-time (prompts for registry credentials)
#   make release   # build + push both :latest and :<git-sha> tags
#
# Override defaults from the command line, e.g.:
#   make release TAG=v1.0.0
#   make release REGISTRY=registry.other.com IMAGE=vacu/app

REGISTRY    ?= registry.tagatechx.com
IMAGE       ?= vacu/app
PLATFORM    ?= linux/amd64
GIT_SHA     := $(shell git rev-parse --short HEAD 2>/dev/null || echo nosha)
GIT_DIRTY   := $(shell git diff --quiet 2>/dev/null || echo -dirty)
TAG         ?= $(GIT_SHA)$(GIT_DIRTY)

FULL        := $(REGISTRY)/$(IMAGE)
TAGGED      := $(FULL):$(TAG)
LATEST      := $(FULL):latest

.PHONY: help build push release login info test clean backup restore

help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"; printf "Targets:\n"} /^[a-zA-Z0-9_-]+:.*##/ { printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

info: ## Print computed image names/tags
	@echo "REGISTRY = $(REGISTRY)"
	@echo "IMAGE    = $(IMAGE)"
	@echo "TAG      = $(TAG)"
	@echo "PLATFORM = $(PLATFORM)"
	@echo "→ $(TAGGED)"
	@echo "→ $(LATEST)"

login: ## Log in to the registry (interactive)
	docker login $(REGISTRY)

build: ## Build image for $(PLATFORM); tags :$(TAG) and :latest
	docker buildx build \
	  --platform $(PLATFORM) \
	  --load \
	  -t $(TAGGED) \
	  -t $(LATEST) \
	  .

push: ## Push both tags to the registry (image must be built first)
	docker push $(TAGGED)
	docker push $(LATEST)

release: ## build + push in one shot (uses buildx --push, no local load)
	docker buildx build \
	  --platform $(PLATFORM) \
	  --push \
	  -t $(TAGGED) \
	  -t $(LATEST) \
	  .
	@echo "✓ Released $(TAGGED) (+ :latest)"

test: ## Run the full test suite (nodectr-based integration tests need Docker)
	npm test

clean: ## Remove locally-cached image tags
	-docker image rm $(TAGGED) $(LATEST) 2>/dev/null || true

backup: ## Snapshot Postgres + uploads to ./backups/<timestamp>/
	./scripts/backup.sh

restore: ## Restore from backup dir: make restore SRC=backups/<timestamp>
	@test -n "$(SRC)" || (echo "Usage: make restore SRC=backups/<timestamp>" >&2; exit 1)
	./scripts/restore.sh $(SRC)
