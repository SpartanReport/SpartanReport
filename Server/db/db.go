// db/db.go
package db

import (
	"context"
	"encoding/json"
	"fmt"
	spartanreport "spartanreport/structures"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var MongoClient *mongo.Client

func GetCollection(name string) *mongo.Collection {
	return MongoClient.Database("halo_stats_db").Collection(name) // Ensure the database name is correct
}

func AddKit(collectionName string, gamerXUID string, loadoutData spartanreport.CustomKit) error {
	collection := GetCollection(collectionName)

	filter := bson.M{"gamerinfo.xuid": gamerXUID}
	update := bson.M{
		"$push": bson.M{
			"loadouts": loadoutData,
		},
	}

	_, err := collection.UpdateOne(context.TODO(), filter, update, options.Update().SetUpsert(true))
	if err != nil {
		return err
	}

	return nil
}

// UpdateKit updates the specified custom kit in the database
func UpdateKit(collectionName string, gamerXUID string, kitId string, newKitData spartanreport.CustomKit) error {
	collection := GetCollection(collectionName)
	fmt.Println("Updating Kit: ", kitId)
	fmt.Println("new Data: ", newKitData)
	// marshal newkitdata into pretty json for printing
	prettyJSON, _ := json.MarshalIndent(newKitData, "", "    ")

	fmt.Println("Pretty JSON of newKitData:")
	fmt.Println(string(prettyJSON))

	// Define the filter to match the document
	filter := bson.M{"gamerinfo.xuid": gamerXUID, "loadouts.id": kitId}

	// Define the update operation to update the kit details
	update := bson.M{
		"$set": bson.M{
			"loadouts.$": newKitData, // Updates the matching element in the loadouts array
		},
	}

	// Perform the update operation
	_, err := collection.UpdateOne(context.TODO(), filter, update)
	if err != nil {
		return err
	}

	return nil
}

func DeleteKit(collectionName string, gamerXUID string, kitId string) error {
	collection := GetCollection(collectionName)
	fmt.Println("Deleting Kit: ", kitId)
	// Define the filter to match the document
	filter := bson.M{"gamerinfo.xuid": gamerXUID}

	// Define the update operation to pull the kit from the loadouts array
	update := bson.M{
		"$pull": bson.M{
			"loadouts": bson.M{"id": kitId}, // Assumes kits have an "Id" field to identify them
		},
	}

	// Perform the update operation
	_, err := collection.UpdateOne(context.TODO(), filter, update)
	if err != nil {
		return err
	}

	return nil
}

// GetKit fetches kits based on a filter and returns them as JSON
func GetKit(collectionName string, gamerXUID string) ([]byte, error) {
	collection := GetCollection(collectionName)
	filter := bson.M{"gamerinfo.xuid": gamerXUID}

	// This projection is optional, it's here to only include the loadouts in the result
	projection := bson.M{
		"loadouts": 1,
		"_id":      0,
	}

	// FindOptions to include projection
	findOptions := options.Find().SetProjection(projection)

	// Querying the collection
	cur, err := collection.Find(context.TODO(), filter, findOptions)
	if err != nil {
		return nil, err
	}
	defer cur.Close(context.Background())

	var kits []bson.M
	for cur.Next(context.Background()) {
		var kit bson.M
		err := cur.Decode(&kit)
		if err != nil {
			return nil, err
		}
		kits = append(kits, kit)
	}
	if err := cur.Err(); err != nil {
		return nil, err
	}

	// Convert the result to JSON
	jsonData, err := json.Marshal(kits)
	if err != nil {
		return nil, err
	}

	return jsonData, nil
}

func StoreDataMatch(collectionName string, data interface{}, uniqueFieldValue string) error {
	collection := GetCollection(collectionName)
	uniqueField := "MatchId"

	// Use the upsert option: Insert if it doesn't exist, otherwise update.
	opts := options.Update().SetUpsert(true)
	filter := bson.M{uniqueField: uniqueFieldValue}
	update := bson.M{"$set": data}

	_, err := collection.UpdateOne(context.TODO(), filter, update, opts)
	return err
}

func StoreDataItem(collectionName string, data interface{}, uniqueFieldValue string) error {
	collection := GetCollection(collectionName)
	uniqueField := "inventoryitempath"

	// Use the upsert option: Insert if it doesn't exist, otherwise update.
	opts := options.Update().SetUpsert(true)
	filter := bson.M{uniqueField: uniqueFieldValue}
	update := bson.M{"$set": data}

	_, err := collection.UpdateOne(context.TODO(), filter, update, opts)
	return err
}

func StoreData(collectionName string, data interface{}) error {
	collection := GetCollection(collectionName)
	_, err := collection.InsertOne(context.TODO(), data)
	return err
}

func CheckAndAddProgression(collectionName string, data interface{}, uniqueField string, uniqueValue interface{}) error {
	collection := GetCollection(collectionName)

	// Create a filter to check for the existence of the document with the unique field.
	filter := bson.M{uniqueField: uniqueValue}

	// Use the FindOne method to check for the document's existence.
	var result bson.M
	err := collection.FindOne(context.TODO(), filter).Decode(&result)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			// If no document exists, insert the new document.
			_, err := collection.InsertOne(context.TODO(), data)
			if err != nil {
				return fmt.Errorf("failed to insert document: %v", err)
			}
			return nil // Success
		}
		// Handle other potential errors from FindOne.
		return fmt.Errorf("failed to check document existence: %v", err)
	}

	// If the document already exists, you can choose to update it, do nothing, or handle as needed.
	// For this example, we'll simply return an error indicating the document already exists.
	return fmt.Errorf("document with %s '%v' already exists", uniqueField, uniqueValue)
}

func IsCollectionEmpty(collectionName string) (bool, error) {
	collection := GetCollection(collectionName)
	count, err := collection.CountDocuments(context.Background(), bson.M{})
	if err != nil {
		return false, err
	}
	return count == 0, nil
}
func StoreOrUpdateData(collectionName string, data interface{}, uniqueValue interface{}) error {
	collection := GetCollection(collectionName)

	// Create a filter for the document to update based on a unique field.
	filter := bson.M{"gamerinfo": uniqueValue}

	// Prepare the update document using $set to ensure only specified fields are updated.
	update := bson.M{"$set": data}

	// Set the options to upsert - this creates a new document if no document matches the filter.
	opts := options.Update().SetUpsert(true)

	// Attempt to update the document.
	_, err := collection.UpdateOne(context.TODO(), filter, update, opts)
	if err != nil {
		return err
	}

	return nil
}

func GetData(collectionName string, filter bson.M, result interface{}) error {
	collection := GetCollection(collectionName)

	err := collection.FindOne(context.TODO(), filter).Decode(result)
	if err != nil {
		fmt.Printf("Error finding data in collection %s with filter %v: %v\n", collectionName, filter, err)
		return err
	}
	return nil
}

func BulkGetData(collectionName string, filter bson.M, result interface{}) error {
	collection := GetCollection(collectionName)

	cursor, err := collection.Find(context.TODO(), filter)
	if err != nil {
		fmt.Printf("Error finding data in collection %s with filter %v: %v\n", collectionName, filter, err)
		return err
	}
	defer cursor.Close(context.TODO())

	if err := cursor.All(context.TODO(), result); err != nil {
		fmt.Printf("Error decoding data: %v\n", err)
		return err
	}

	return nil
}
func CreateIndex(collectionName string, keys bson.D) error {
	collection := GetCollection(collectionName)
	indexModel := mongo.IndexModel{Keys: keys}
	_, err := collection.Indexes().CreateOne(context.TODO(), indexModel)
	return err
}

func StoreManyData(collectionName string, data []interface{}) error {
	collection := GetCollection(collectionName)
	_, err := collection.InsertMany(context.TODO(), data)
	return err
}

// QueryDataByType queries the item_data collection with a filter on the type field.
func QueryDataByType(collectionName string, filterType string, data interface{}) error {
	collection := GetCollection(collectionName)
	filter := bson.M{"type": filterType} // Create a filter for the type field

	// Query the collection
	cur, err := collection.Find(context.TODO(), filter)
	if err != nil {
		fmt.Printf("Error querying data in collection %s with filter %v: %v\n", collectionName, filter, err)
		return err
	}
	defer cur.Close(context.TODO())

	// Decode the results into the data interface
	if err := cur.All(context.TODO(), data); err != nil {
		fmt.Printf("Error decoding results into data interface: %v\n", err)
		return err
	}

	return nil
}
