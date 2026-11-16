COMPOSE_FILE:=-f ./infrastructure/docker-compose.yml

.PHONY: up
up:
	docker compose $(COMPOSE_FILE) up -d 

.PHONY: build
build:
	docker compose $(COMPOSE_FILE) up -d --build

.PHONY: setup
setup:
	@echo "Copying .env.example to .env"
	-./scripts/copy-env-example-to-env.sh
	@echo
	@echo "Generating AI service key"
	@sh ./scripts/generate-ai-service-key.sh
	@echo
	@echo "Setting up storage"
	-@./scripts/setup-storage.sh
	@echo
	@echo "Creating Jwt Keys"
	-@./scripts/generate-jwt-keys.sh
	@echo
	@echo "Generating SSL certificates"
	-@./scripts/generate-ssl-certs.sh

frontend:
	docker compose $(COMPOSE_FILE) down frontend
	docker compose $(COMPOSE_FILE) up -d --build frontend

auth:
	docker compose $(COMPOSE_FILE) up -d auth auth-db

.PHONY: live
live:
	docker compose $(COMPOSE_FILE) up

.PHONY: down
down:
	docker compose $(COMPOSE_FILE) down

.PHONY: re
re: clean up

.PHONY: restart
restart:
	docker compose $(COMPOSE_FILE) restart

.PHONY: clean
clean:
	docker compose $(COMPOSE_FILE) down --rmi all 

.PHONY: fclean
fclean: down
	docker compose $(COMPOSE_FILE) down --rmi all --volumes 


.PHONY: config
config:
	docker compose $(COMPOSE_FILE) config 

