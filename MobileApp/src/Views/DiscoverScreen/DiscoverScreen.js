import * as React from 'react';
import {View, StyleSheet, PermissionsAndroid,} from 'react-native'
import MapView from 'react-native-maps';  
import { Marker } from 'react-native-maps';  
import database from '@react-native-firebase/database';
import Geolocation from '@react-native-community/geolocation';
import {generateResult} from '../../components/UserDataHandling/UserDataHandling'
import ActivityIndicator from '../../components/ActivityIndicator/ActivityIndicator'
import {NavigationEvents} from 'react-navigation'
import {ref} from '../../components/Database/Database'

var MapStyle = require('../../config/map.json')

class DiscoverScreen extends React.Component{
    
    static navigationOptions = ({navigation})=>{
        return {
            headerTitle: 'Explore Near By',
            headerStyle: {
              backgroundColor: '#4b8b3b',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
            fontWeight: 'bold',
            },
        }
    }

    constructor(props){
        super(props)
        
        this.state={
            observations: [],
            location: [82.0,6.8],
            activityIndicator: true,
            locationPermission: false
        }
    }

    componentDidMount(){
        this.findCoordinates()
        database().ref('/users/').on("value", snapshot=>{
            this.getObservations()
        })
        
    }

    getObservations = async function (){        
        // Fetch the data snapshot
        const snapshot = await ref.once('value');

        const val = snapshot.val()

        let observations = []

        for(let i in val){
            let name = val[i].name
            let photo = val[i].photo
            let userNick = val[i].name.toLowerCase().replace(/ /g, '')
            let obs = val[i].observations
            
            if(obs!==undefined){
                for(let j in obs){
                    let time = new Date(obs[j].time)
                    let crntTime = new Date().getTime()
                    let dif = crntTime-time
                    if(dif<=604800000){continue}
                    let photUrl = obs[j].photoURL
                    let location = obs[j].location
                    time = time.toString().split(" ")
                    time = time.splice(0,time.length-1)
                    time = time.toString().replace(/,/g, ' ')
                    let result = generateResult(obs[j])
                    let marker = 
                    {
                        title: time,
                        cordinates: 
                        {
                            latitude: obs[j].location[1],
                            longitude: obs[j].location[0]
                        },
                        description: location.toString()
                       
                    }
                    observations.push([name, photo, photUrl, location, time, userNick, result, marker])
                    await this.setState({
                        observations: observations,
                    })
                }
            }
            
        }
    }

    findCoordinates = async () => {
            try {
                await this.setState({
                    activityIndicator: true
                })
                const granted = await PermissionsAndroid.request(
                  PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
              );
              if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                await Geolocation.getCurrentPosition(
                    position => {
                        const initialPosition = position;
                        const lon = initialPosition['coords']['longitude']
                        const lat = initialPosition['coords']['latitude']
                        console.log(lon, lat)
                        this.setState({location: [lon, lat]});
                    },
                    error => console.log('Error', JSON.stringify(error)),
                    {enableHighAccuracy: false},
                );
                await this.setState({
                    activityIndicator: false,
                    locationPermission: true
                })
              } else {
                await this.setState({
                    activityIndicator: false
                })
                
              }
              } catch (err) {
              }
            
        
    };

    render() {
        return (
            <View style={styles.MainContainer}>
                <NavigationEvents onDidFocus={!this.state.locationPermission?this.findCoordinates:null}/>
                {this.state.activityIndicator?
                    <View style={{width: "100%", backgroundColor: 'grey'}}>
                        <ActivityIndicator title={"Loading"} showIndicator={this.state.activityIndicator}/>
                    </View>
                :
                    <MapView  
                        customMapStyle={MapStyle}
                        style={styles.mapStyle}  
                        showsUserLocation={true}  
                        zoomEnabled={true}  
                        zoomControlEnabled={true}  
                        initialRegion={{  
                            latitude: this.state.location[1],   
                            longitude: this.state.location[0],  
                            latitudeDelta: 1.2922,  
                            longitudeDelta: 0.0421,  
                    }}>  
                        {this.state.observations.map((val, i) => (
                            <Marker
                                key={i}
                                coordinate={val[7].cordinates}
                                title={val[7].title}
                                description={val[7].description}
                                onPress={()=>this.props.navigation.navigate('showDetailedPhoto',
                                {
                                    img: val[2],
                                    title: val[0],
                                    subtitle:val[5],
                                    user: val[1],
                                    content: val[6],
                                    showPhoto: this.props.navigation
                                }
                                )}
                                // image={require('../../Assets/landing2WS.png')}
                            />
                        ))}
                    </MapView> 
                    }  
            </View>  
            
        );
    }
}

const styles = StyleSheet.create({  
    MainContainer: {  
      position: 'absolute',  
      top: 0,  
      left: 0,  
      right: 0,  
      bottom: 0,  
      alignItems: 'center',  
      justifyContent: 'flex-end',  
    },  
    mapStyle: {  
      position: 'absolute',  
      top: 0,  
      left: 0,  
      right: 0,  
      bottom: 0,  
    },  
  });  
export default DiscoverScreen;

