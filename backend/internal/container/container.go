package container

import (
	"bruska/internal/app"
	"bruska/internal/config"
	"bruska/internal/infrastructure/firebaseauth"
	"bruska/internal/infrastructure/objectstorage"
	"bruska/internal/server"
	"bruska/internal/service"
	"bruska/internal/store"
	"bruska/internal/store/postgres"
	"sync"
)

type Container interface {
	Starters() []app.StarterFunc
	Stoppers() []app.StopperFunc
	Server() *server.Server
}

type containerImpl struct {
	server     *server.Server
	serverOnce sync.Once

	service     service.Store
	serviceOnce sync.Once

	store     store.Store
	storeOnce sync.Once

	postgres     *postgres.Client
	postgresOnce sync.Once

	objectStorage     objectstorage.Client
	objectStorageOnce sync.Once

	firebaseAuth     firebaseauth.Client
	firebaseAuthOnce sync.Once
}

func New(_ string) Container {
	return &containerImpl{}
}

func (c *containerImpl) Starters() []app.StarterFunc {
	return []app.StarterFunc{
		c.Postgres().Start,
	}
}

func (c *containerImpl) Stoppers() []app.StopperFunc {
	return []app.StopperFunc{
		c.Postgres().Stop,
	}
}

func (c *containerImpl) Store() store.Store {
	if c.store == nil {
		c.storeOnce.Do(func() {
			c.store = store.New(c.Postgres().DB())
		})
	}
	return c.store
}

func (c *containerImpl) Postgres() *postgres.Client {
	if c.postgres == nil {
		c.postgresOnce.Do(func() {
			config.InitDB()
			client, err := postgres.New(config.DB.URL)
			if err != nil {
				panic(err)
			}
			c.postgres = client
		})
	}
	return c.postgres
}

func (c *containerImpl) Service() service.Store {
	if c.service == nil {
		c.serviceOnce.Do(func() {
			c.service = service.NewServiceStore(c.Store())
		})
	}
	return c.service
}

func (c *containerImpl) Server() *server.Server {
	if c.server == nil {
		c.serverOnce.Do(func() {
			config.InitServer()
			c.server = server.New(config.Server.Port, c.Service(), c.ObjectStorage(), c.FirebaseAuth())
		})
	}
	return c.server
}

func (c *containerImpl) ObjectStorage() objectstorage.Client {
	if c.objectStorage == nil {
		c.objectStorageOnce.Do(func() {
			config.InitStorage()
			c.objectStorage = objectstorage.New(objectstorage.Config{
				Endpoint:      config.Storage.Endpoint,
				Region:        config.Storage.Region,
				Bucket:        config.Storage.Bucket,
				KeyID:         config.Storage.KeyID,
				SecretKey:     config.Storage.SecretKey,
				PublicBaseURL: config.Storage.PublicBaseURL,
				UsePathStyle:  config.Storage.UsePathStyle,
			})
		})
	}
	return c.objectStorage
}

func (c *containerImpl) FirebaseAuth() firebaseauth.Client {
	if c.firebaseAuth == nil {
		c.firebaseAuthOnce.Do(func() {
			config.InitAuth()
			c.firebaseAuth = firebaseauth.New(firebaseauth.Config{
				ProjectID:          config.Auth.FirebaseProjectID,
				ClientEmail:        config.Auth.FirebaseClientEmail,
				PrivateKey:         config.Auth.FirebasePrivateKey,
				PrivateKeyID:       config.Auth.FirebasePrivateKeyID,
				ClientID:           config.Auth.FirebaseClientID,
				AdminUIDs:          config.Auth.FirebaseAdminUIDs,
				ServiceAccountPath: config.Auth.FirebaseServiceAcctPath,
			})
		})
	}
	return c.firebaseAuth
}
