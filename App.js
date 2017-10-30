'use strict';

// imports
import React, { Component } from 'react';
import {
  ActivityIndicator,
  ListView,
  Platform,
  StyleSheet,
  Text,
  View
} from 'react-native';
import _ from 'lodash';
import PetCell from './PetCell';

// immutable API key
const API_KEY = 'cb55e117215c6eb73506d7164b0a3b6d';

// convert API info with lodash
const convert = (obj) => {
  console.log(obj);
  let result = {};
  _.map(obj, (item, key) => {
    let value;
    if (typeof (item) === 'object') {
      if (item.$t) { value = item.$t; }
      else { value = convert(item); }
    }
    else { value = item; }
    result[key] = value;
  });
  console.log(result);
  return result;
};


// define empty array to store data from API
let resultsCache = [];


export default class App extends Component {

  state = {
    isLoading: false,
    isLoadingTail: false,
    lastOffset: 0,
    dataSource: new ListView.DataSource({
      rowHasChanged: (row1, row2) => row1 !== row2,
    }),
  };

  componentDidMount() {
    this.fetchPets();
  }

  fetchPets = () => {

    // API url
    const offset = this.state.lastOffset,
      URL = `https://api.petfinder.com/pet.find?location=US&format=json&offset=${offset}&key=${API_KEY}`;

    if (_.isEmpty(resultsCache)) {
      this.setState({isLoading: true});
    }

    // URL fetching and cleaning
    fetch(URL)
      .then((response) => response.json())
      .catch((error) => {
        this.setState({
          dataSource: this.getDataSource([]),
          isLoading: false,
        });
      })
      .then((data) => {
        resultsCache = _.concat(resultsCache, _.toArray(convert(data.petfinder.pets.pet)));
        this.setState({
          isLoading: false,
          isLoadingTail: false,
          lastOffset: data.petfinder.lastOffset.$t,
          dataSource: this.getDataSource(resultsCache),
        });
      })
      .done();
  }

  getDataSource = (pets: Array<any>): ListView.DataSource => {
    return this.state.dataSource.cloneWithRows(pets);
  }

  onEndReached = () => {
    // We're already fetching
    if (this.state.isLoadingTail) {
      return;
    }
    this.setState({
      isLoadingTail: true,
    });
    this.fetchPets();
  }

  renderRow = (
    pet: Object,
    sectionID: number | string,
    rowID: number | string,
    highlightRowFunc: (sectionID: ?number | string, rowID: ?number | string) => void
  ) => {
    return (
      <PetCell
        key={pet.id}
        onHighlight={() => highlightRowFunc(sectionID, rowID)}
        onUnhighlight={() => highlightRowFunc(null, null)}
        pet={pet}
      />
    );
  }

  renderFooter = () => {
    if (!this.state.isLoadingTail) {
      return <View style={styles.scrollSpinner} />;
    }

    return <ActivityIndicator style={styles.scrollSpinner} />;
  }

  render() {
    const { isLoading } = this.state;
    return (
      <View style={styles.container}>
        {isLoading
          ? <View style={styles.loading}><Text>Loading...</Text></View>
          : <ListView
            dataSource={this.state.dataSource}
            renderFooter={this.renderFooter}
            renderRow={this.renderRow}
            onEndReached={this.onEndReached}
            automaticallyAdjustContentInsets={false}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps={true}
            showsVerticalScrollIndicator={false}
          />
        }
      </View>
    );
  }

}

const styles = StyleSheet.create({
  container: {
    marginTop: Platform.OS === 'ios' ? 64 : 0,
    flex: 1,
    backgroundColor: 'grey',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollSpinner: {
    marginVertical: 20,
  },
});