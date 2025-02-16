import {
  FinishMode,
  IWaveformRef,
  PermissionStatus,
  PlaybackSpeedType,
  PlayerState,
  RecorderState,
  UpdateFrequency,
  Waveform,
  useAudioPermission,
} from '@simform_solutions/react-native-audio-waveform';
import React, {Dispatch, SetStateAction, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {Icons} from '../../assets';
import {playbackSpeedSequence, type ListItem} from '../../constants';
import stylesheet from '../../styles';
import {Colors} from '../../theme';
import FastImage from 'react-native-fast-image';
import {GreetingTextComponent} from '../../components/GreetingTextComponent/GreetingTextComponent';

let currentPlayingRef: React.RefObject<IWaveformRef> | undefined;

function formatTime(milliseconds) {
  // Convert milliseconds to seconds
  const seconds = Math.floor(milliseconds / 1000);

  // Calculate minutes and remaining seconds
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  // Format the seconds with leading zero if needed
  const formattedSeconds = remainingSeconds.toString().padStart(2, '0');

  // Return the formatted time as "minutes:seconds"
  return `${minutes}:${formattedSeconds}`;
}
const RenderListItem = React.memo(
  ({
    item,
    onPanStateChange,
    currentPlaybackSpeed,
    changeSpeed,
  }: {
    item: ListItem;
    onPanStateChange: (value: boolean) => void;
    currentPlaybackSpeed: PlaybackSpeedType;
    changeSpeed: () => void;
  }) => {
    const ref = useRef<IWaveformRef>(null);
    const [playerState, setPlayerState] = useState(PlayerState.stopped);
    const styles = stylesheet({currentUser: item.fromCurrentUser});
    const [isLoading, setIsLoading] = useState(true);
    const [songDuration, setSongDuration] = useState(0);
    const handlePlayPauseAction = async () => {
      // If we are recording do nothing
      if (
        currentPlayingRef?.current?.currentState === RecorderState.recording
      ) {
        return;
      }

      const startNewPlayer = async () => {
        currentPlayingRef = ref;
        if (ref.current?.currentState === PlayerState.paused) {
          await ref.current?.resumePlayer();
        } else {
          await ref.current?.startPlayer({
            finishMode: FinishMode.stop,
          });
        }
      };

      // If no player or if current player is stopped just start the new player!
      if (
        currentPlayingRef == null ||
        [PlayerState.stopped, PlayerState.paused].includes(
          currentPlayingRef?.current?.currentState as PlayerState,
        )
      ) {
        await startNewPlayer();
      } else {
        // Pause current player if it was playing
        if (currentPlayingRef?.current?.currentState === PlayerState.playing) {
          await currentPlayingRef?.current?.pausePlayer();
        }

        // Start player when it is a different one!
        if (currentPlayingRef?.current?.playerKey !== ref?.current?.playerKey) {
          await startNewPlayer();
        }
      }
    };

    const handleStopAction = async () => {
      ref.current?.stopPlayer();
    };

    return (
      <View key={item.path} style={[styles.listItemContainer]}>
        <View style={styles.listItemWidth}>
          <View style={[styles.buttonContainer]}>
            <Pressable
              disabled={isLoading}
              onPress={handlePlayPauseAction}
              style={styles.playBackControlPressable}>
              {isLoading ? (
                <ActivityIndicator color={'#FFFFFF'} />
              ) : (
                <FastImage
                  source={
                    playerState !== PlayerState.playing
                      ? Icons.play
                      : Icons.pause
                  }
                  style={styles.buttonImage}
                  resizeMode="contain"
                />
              )}
            </Pressable>
            <Pressable
              disabled={PlayerState.stopped == playerState}
              onPress={handleStopAction}
              style={styles.playBackControlPressable}>
              {isLoading ? (
                <ActivityIndicator color={'#FFFFFF'} />
              ) : (
                <FastImage
                  source={Icons.stop}
                  style={[
                    styles.stopButton,
                    {
                      opacity: playerState === PlayerState.stopped ? 0.5 : 1,
                    },
                  ]}
                  resizeMode="contain"
                />
              )}
            </Pressable>
            <Waveform
              containerStyle={styles.staticWaveformView}
              mode="static"
              key={item.path}
              playbackSpeed={currentPlaybackSpeed}
              ref={ref}
              path={item.path}
              candleSpace={2}
              candleWidth={4}
              scrubColor={Colors.white}
              waveColor={Colors.lightWhite}
              candleHeightScale={4}
              onPlayerStateChange={setPlayerState}
              onPanStateChange={onPanStateChange}
              onError={error => {
                console.log(error, 'we are in example');
              }}
              onCurrentProgressChange={(currentProgress, songDuration) => {
                console.log(
                  `currentProgress ${currentProgress}, songDuration ${songDuration}`,
                );
                setSongDuration(songDuration);
              }}
              onChangeWaveformLoadState={state => {
                setIsLoading(state);
              }}
            />
            <Text>{formatTime(songDuration)}</Text>
          </View>
        </View>
      </View>
    );
  },
);

const LivePlayerComponent = ({
  setList,
}: {
  setList: Dispatch<SetStateAction<ListItem[]>>;
}) => {
  const ref = useRef<IWaveformRef>(null);
  const [recorderState, setRecorderState] = useState(RecorderState.stopped);
  const styles = stylesheet();
  const {checkHasAudioRecorderPermission, getAudioRecorderPermission} =
    useAudioPermission();

  const startRecording = () => {
    ref.current
      ?.startRecord({
        updateFrequency: UpdateFrequency.high,
      })
      .then(() => {})
      .catch(() => {});
  };

  const handleRecorderAction = async () => {
    if (recorderState === RecorderState.stopped) {
      // Stopping other player before starting recording
      if (currentPlayingRef?.current?.currentState === PlayerState.playing) {
        currentPlayingRef?.current?.stopPlayer();
      }

      const hasPermission = await checkHasAudioRecorderPermission();

      if (hasPermission === PermissionStatus.granted) {
        currentPlayingRef = ref;
        startRecording();
      } else if (hasPermission === PermissionStatus.undetermined) {
        const permissionStatus = await getAudioRecorderPermission();
        if (permissionStatus === PermissionStatus.granted) {
          currentPlayingRef = ref;
          startRecording();
        }
      } else {
        Linking.openSettings();
      }
    } else {
      ref.current?.stopRecord().then(path => {
        setList(prev => [...prev, {fromCurrentUser: true, path}]);
      });
      currentPlayingRef = undefined;
    }
  };

  return (
    <View style={styles.liveWaveformContainer}>
      <Waveform
        mode="live"
        containerStyle={styles.liveWaveformView}
        ref={ref}
        candleSpace={2}
        candleWidth={4}
        waveColor={Colors.pink}
        onRecorderStateChange={setRecorderState}
      />
      <Pressable
        onPress={handleRecorderAction}
        style={styles.recordAudioPressable}>
        <Image
          source={
            recorderState === RecorderState.stopped ? Icons.mic : Icons.stop
          }
          style={styles.buttonImageLive}
          resizeMode="contain"
        />
      </Pressable>
    </View>
  );
};

const HomeContainer = () => {
  const [shouldScroll, setShouldScroll] = useState<boolean>(true);
  const [list, setList] = useState<ListItem[]>([]);
  const [currentPlaybackSpeed, setCurrentPlaybackSpeed] =
    useState<PlaybackSpeedType>(1.0);

  const {top, bottom} = useSafeAreaInsets();
  const styles = stylesheet({top, bottom});

  // useEffect(() => {
  //   generateAudioList().then(audioListArray => {
  //     if (audioListArray?.length > 0) {
  //       setList(audioListArray);
  //     }
  //   });
  // }, []);

  // useEffect(() => {
  //   getRecordedAudios().then(recordedAudios =>
  //     setNumberOfRecording(recordedAudios.length),
  //   );
  // }, [list]);

  const changeSpeed = () => {
    setCurrentPlaybackSpeed(
      prev =>
        playbackSpeedSequence[
          (playbackSpeedSequence.indexOf(prev) + 1) %
            playbackSpeedSequence.length
        ] ?? 1.0,
    );
  };

  const handleDeleteRecordings = async () => {
    // const recordings = await getRecordedAudios();
    // const deleteRecordings = async () => {
    //   await Promise.all(recordings.map(async recording => fs.unlink(recording)))
    //     .then(() => {
    //       generateAudioList().then(audioListArray => {
    //         setList(audioListArray);
    //       });
    //     })
    //     .catch(error => {
    //       Alert.alert(
    //         'Error deleting recordings',
    //         'Below error happened while deleting recordings:\n' + error,
    //         [{text: 'Dismiss'}],
    //       );
    //     });
    // };
    // Alert.alert(
    //   'Delete all recording',
    //   `Continue to delete all ${recordings.length} recordings.`,
    //   [
    //     {text: 'Cancel', style: 'cancel'},
    //     {text: 'OK', onPress: deleteRecordings},
    //   ],
    // );
  };

  return (
    <View style={styles.appContainer}>
      <StatusBar
        barStyle={'dark-content'}
        backgroundColor={'transparent'}
        animated
        translucent
      />
      <View style={styles.header}>
        <Text>icons</Text>
        <Text>TravelGPT</Text>
        <View style={styles.iconContainer} />
      </View>
      {list.length == 0 && <GreetingTextComponent />}
      <GestureHandlerRootView style={styles.appContainer}>
        <View style={styles.screenBackground}>
          <View style={styles.container}>
            <ScrollView scrollEnabled={shouldScroll}>
              {list.map(item => (
                <RenderListItem
                  key={item.path}
                  item={item}
                  onPanStateChange={value => setShouldScroll(!value)}
                  {...{currentPlaybackSpeed, changeSpeed}}
                />
              ))}
            </ScrollView>
          </View>
          <LivePlayerComponent setList={setList} />
        </View>
      </GestureHandlerRootView>
    </View>
  );
};

export default function Home() {
  return (
    <SafeAreaProvider>
      <HomeContainer />
    </SafeAreaProvider>
  );
}
