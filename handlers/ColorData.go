package halotestapp

import (
	"bytes"
	"fmt"
	"image"
	_ "image/jpeg" // Import image decoders
	_ "image/png"
	"sort"
)

func GetColorPercentages(imageData []byte) map[string]string {
	// Decode into an image.Image
	imgReader := bytes.NewReader(imageData)
	img, _, err := image.Decode(imgReader)
	if err != nil {
		fmt.Println("Failed to decode image:", err)
		return nil
	}

	// Create a map to hold the hex color and its frequency
	colorCount := make(map[string]int)

	// Loop through each pixel
	for y := 0; y < img.Bounds().Dy(); y++ {
		for x := 0; x < img.Bounds().Dx(); x++ {
			c := img.At(x, y)

			r, g, b, _ := c.RGBA()
			hex := fmt.Sprintf("#%02X%02X%02X", uint8(r>>8), uint8(g>>8), uint8(b>>8))

			colorCount[hex]++
		}
	}

	// Sort by frequency
	type kv struct {
		Key   string
		Value int
	}

	var ss []kv
	for k, v := range colorCount {
		ss = append(ss, kv{k, v})
	}

	sort.Slice(ss, func(i, j int) bool {
		return ss[i].Value > ss[j].Value
	})

	// Create the result map
	result := make(map[string]string)

	if len(ss) > 0 {
		result["primary"] = ss[0].Key
	}
	if len(ss) > 1 {
		result["secondary"] = ss[1].Key
	}
	if len(ss) > 2 {
		result["tertiary"] = ss[2].Key
	}

	return result
}
