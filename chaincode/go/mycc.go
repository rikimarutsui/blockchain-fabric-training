/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/*
 * The sample smart contract for documentation topic:
 * Writing Your First Blockchain Application
 */

package main

/* Imports
 * 4 utility libraries for formatting, handling bytes, reading and writing JSON, and string manipulation
 * 2 specific Hyperledger Fabric specific libraries for Smart Contracts
 */
import (
	"bytes"
	"encoding/json"
	"fmt"
	// "strconv"
	"math/big"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/hyperledger/fabric/core/chaincode/shim/ext/cid"
	sc "github.com/hyperledger/fabric/protos/peer"
)

// Define the Smart Contract structure
type SmartContract struct {
}

type Product struct{
	Name string `json:"name"`
	Description string `json:"description"`
	Stage string `json:"status"`
	Signatures []Signature `json:"signatures"`
	CreatedBy string `json:"createdBy"`
	MaxStage string `json:"maxStage"`
	Completed bool `json:"completed"`
}

type Signature struct{
	Name string `json:"name"`
	Stage string `json:"stage"`
}

/*
 * The Init method is called when the Smart Contract "mycc" is instantiated by the blockchain network
 * Best practice is to have any Ledger initialization in separate function -- see initLedger()
 */
func (s *SmartContract) Init(APIstub shim.ChaincodeStubInterface) sc.Response {
	return shim.Success(nil)
}

/*
 * The Invoke method is called as a result of an application request to run the Smart Contract "mycc"
 * The calling application program has also specified the particular smart contract function to be called, with arguments
 */
func (s *SmartContract) Invoke(APIstub shim.ChaincodeStubInterface) sc.Response {

	// Retrieve the requested Smart Contract function and arguments
	function, args := APIstub.GetFunctionAndParameters()
	// Route to the appropriate handler function to interact with the ledger appropriately
	if function == "queryProduct" {
		return s.queryProduct(APIstub, args)
	} else if function == "initLedger" {
		return s.initLedger(APIstub)
	} else if function == "createProduct" {
		return s.createProduct(APIstub, args)
	} else if function == "queryAllProducts" {
		return s.queryAllProducts(APIstub)
	} else if function == "signProduct" {
		return s.signProduct(APIstub, args)
	} else if function == "getMaxProductId" {
		return s.getMaxProductId(APIstub)
	} else if function == "getIncompleteProducts"{
		return s.getIncompleteProducts(APIstub)
	} else if function == "searchProducts" {
		return s.searchProducts(APIstub, args)
	}

	return shim.Error("Function does not exist")
}

func (s *SmartContract) queryProduct(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	productAsBytes, _ := APIstub.GetState(args[0])
	return shim.Success(productAsBytes)
}

func (s *SmartContract) initLedger(APIstub shim.ChaincodeStubInterface) sc.Response {
	var product = Product{Name: "Test Product", Description: "Just a test product to make sure chaincode is running", Stage: "0", CreatedBy: "admin", MaxStage: "3"}
	productAsBytes, _ := json.Marshal(product)
	APIstub.PutState("1", productAsBytes)
	startingId := new(big.Int).SetInt64(2)
	startingIdAsByte := startingId.Bytes()
	APIstub.PutState("MaxProductId", startingIdAsByte) //set starting id as 2
	return shim.Success(nil)
}

func (s *SmartContract) createProduct(APIstub shim.ChaincodeStubInterface, args[] string) sc.Response{
	canCreate, found , _ := cid.GetAttributeValue(APIstub, "canCreate")
	if(!found){
		return shim.Error("User does not have the right to perform the action")
	}
	if(canCreate != "true"){
		return shim.Error("User does not have the right to perform the action")
	}
	if(len(args) != 3){
		return shim.Error("Incorrect number of arguments. Expecting 3 ")
	}

	username, found, _ := cid.GetAttributeValue(APIstub, "username")
	var product = Product{Name: args[0], Description: args[1], Stage: "0", CreatedBy: username, MaxStage: args[2], Completed:  false}
  productIdAsBytes, _ := APIstub.GetState("MaxProductId")
  productId := new(big.Int).SetBytes(productIdAsBytes)
	productIdAsString := productId.String();

	productAsBytes, _ := json.Marshal(product)
	APIstub.PutState(productIdAsString, productAsBytes)

	increment := new(big.Int).SetInt64(1)
	newProductId := new(big.Int).Add(productId, increment)
	APIstub.PutState("MaxProductId", newProductId.Bytes())

	return shim.Success(productAsBytes)
}

func (s *SmartContract) signProduct(APIstub shim.ChaincodeStubInterface, args[] string) sc.Response {
	return shim.Success(nil)
}

func (s *SmartContract) queryAllProducts(APIstub shim.ChaincodeStubInterface) sc.Response {
  // The stupid method but fast
	resultsIterator, err := APIstub.GetStateByRange("0", "99999999")
	if(err != nil){
		return shim.Error(err.Error())
	}
	var buffer bytes.Buffer
	buffer = buildJSON(resultsIterator, buffer)    // cast to JSON format for frontend display
	fmt.Print("- queryAllProducts:\n%s\n", buffer.String())

	return shim.Success(buffer.Bytes())
}

func (s *SmartContract) getMaxProductId(APIstub shim.ChaincodeStubInterface) sc.Response {
	return shim.Success(nil)
}

func (s *SmartContract) getIncompleteProducts(APIstub shim.ChaincodeStubInterface) sc.Response{
	return shim.Success(nil)
}

func (s *SmartContract) searchProducts(APIstub shim.ChaincodeStubInterface, args[] string) sc.Response{
	return shim.Success(nil)
}

func buildJSON(resultsIterator shim.StateQueryIteratorInterface, buffer bytes.Buffer) bytes.Buffer{
	buffer.WriteString("[")
	bArrayMemberAlreadyWritten := false
	for resultsIterator.HasNext() {
		queryResponse, _ := resultsIterator.Next()
		if (bArrayMemberAlreadyWritten == true){
			buffer.WriteString(",")
		}
		buffer.WriteString("{\"ProductId\":")
		buffer.WriteString("\"")
		buffer.WriteString(queryResponse.Key)
		buffer.WriteString("\"")

		buffer.WriteString(", \"Record\":")
		// Record is a JSON object, so we write as-is
		buffer.WriteString(string(queryResponse.Value))
		buffer.WriteString("}")
		bArrayMemberAlreadyWritten = true
	}

	buffer.WriteString("]")
	return buffer
}

// The main function is only relevant in unit test mode. Only included here for completeness.
func main() {

	// Create a new Smart Contract
	err := shim.Start(new(SmartContract))
	if err != nil {
		fmt.Printf("Error creating new Smart Contract: %s", err)
	}
}
