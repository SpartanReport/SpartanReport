// db/db.go
package db

import (
	"context"
	"fmt"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var MongoClient *mongo.Client

func GetCollection(name string) *mongo.Collection {
	return MongoClient.Database("halo_stats_db").Collection(name) // Ensure the database name is correct
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

func StoreData(collectionName string, data interface{}) error {
	collection := GetCollection(collectionName)
	_, err := collection.InsertOne(context.TODO(), data)
	return err
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
