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
