package main

import (
	"bruska/internal/app"
	"bruska/internal/config"
	"bruska/internal/container"
	"fmt"
)

const appName = "bruska"

func main() {
	config.InitApp()
	c := container.New(appName)
	a := app.New(c.Server(), c.Starters(), c.Stoppers())
	err := a.Init()
	if err != nil {
		fmt.Printf("[init err] %v\n", err)
	}
}
