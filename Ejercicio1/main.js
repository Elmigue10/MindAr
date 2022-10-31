import {loadGLTF, loadAudio} from "./libs/loader.js";

const THREE = window.MINDAR.IMAGE.THREE;

document.addEventListener('DOMContentLoaded', () => {
  const start = async() => {
    const mindarThree = new window.MINDAR.IMAGE.MindARThree({
      container: document.querySelector("#my-ar-container"),
      imageTargetSrc: './assets/targets/targets.mind',
    });
    const {renderer, scene, camera} = mindarThree;
    let planePositionX;
    let planePositionY;
    let sizeXY;

    const light = new THREE.HemisphereLight( 0xffffff, 0xbbbbff, 1 );
    scene.add(light);

    const geometry = new THREE.PlaneGeometry(0.5, 1);
    const raccoonMaterial = new THREE.MeshBasicMaterial({color: 0x00ffff, transparent: true, opacity: 0.5});
    const bearMaterial = new THREE.MeshBasicMaterial({color: 0xFA0000, transparent: true, opacity: 0.5});
    const raccoonPlane = new THREE.Mesh(geometry, raccoonMaterial);
    const bearPlane = new THREE.Mesh(geometry, bearMaterial);
    raccoonPlane.position.set(0.3, -0.2, -0.2);
    bearPlane.position.set(-0.3, -0.2, -0.2);


    const raccoon = await loadGLTF('./assets/models/musicband-raccoon/scene.gltf');
    raccoon.scene.scale.set(0.05, 0.05, 0.05);
    raccoon.scene.position.set(0.3, -0.4, 0);

    const bear = await loadGLTF('./assets/models/musicband-bear/scene.gltf');
    bear.scene.scale.set(0.05, 0.05, 0.05);
    bear.scene.position.set(-0.3, -0.4, 0);

    const raccoonAnchor = mindarThree.addAnchor(0);
    raccoonAnchor.group.add(raccoon.scene);
    raccoonAnchor.group.add(raccoonPlane);

    const audioClip = await loadAudio('./assets/sounds/musicband-background.mp3');

    const listener = new THREE.AudioListener();
    camera.add(listener);

    const audio = new THREE.PositionalAudio(listener);
    raccoonAnchor.group.add(audio);

    audio.setBuffer(audioClip);
    audio.setRefDistance(100);
    audio.setLoop(true);

    const bearAnchor = mindarThree.addAnchor(0);
    bearAnchor.group.add(bear.scene);
    bearAnchor.group.add(bearPlane);

    const raccoonMixer = new THREE.AnimationMixer(raccoon.scene);
    const racconAction = raccoonMixer.clipAction(raccoon.animations[0]);
    racconAction.play();

    const bearMixer = new THREE.AnimationMixer(bear.scene);
    const bearAction = bearMixer.clipAction(bear.animations[0]);
    bearAction.play();

    const clock = new THREE.Clock();

    document.addEventListener("keypress", function(event){
      if(event.key == "Enter" && audio.isPlaying){
        audio.pause();
      } else if(event.key == "Enter"){
        audio.play();
      }
    })

    raccoonAnchor.onTargetFound = () => {
      audio.play();
    }

    raccoonAnchor.onTargetLost = () => {
      audio.pause();
    }

    document.body.addEventListener('click', (e) => {
      const planeGeometry = new THREE.PlaneGeometry(sizeXY, sizeXY);
      const planeMaterial = new THREE.MeshBasicMaterial({color: Math.random() * 0xffffff, transparent: true, opacity: 0.5});
      const plane = new THREE.Mesh(planeGeometry, planeMaterial);
      
      plane.position.set(planePositionX, planePositionY, -0.15);
      
      raccoonAnchor.group.add(plane);
    });

    let raccoonTransition = 0.0035;
    let bearTransition = -0.0035;
    
    await mindarThree.start();
    renderer.setAnimationLoop(() => {
        planePositionX = Math.random() * (0.5 - (-0.5)) + (-0.5);
        planePositionY = Math.random() * (0.3 - (-0.5)) + (-0.5);
        sizeXY = Math.random() * (0.3 - (0.1)) + (0.1);

        const delta = clock.getDelta();
        raccoon.scene.rotation.set(0, raccoon.scene.rotation.y+delta, 0);
        raccoonMixer.update(delta);

        raccoon.scene.position.y += raccoonTransition;
        if(raccoon.scene.position.y >= 0.1){
          raccoonTransition = -0.0035
        } else if(raccoon.scene.position.y <= -0.5){
          raccoonTransition = 0.0035
        }

        bear.scene.rotation.set(0, bear.scene.rotation.y-delta, 0);
        bearMixer.update(delta);

        bear.scene.position.y -= bearTransition;
        if(bear.scene.position.y >= 0.1){
          bearTransition = 0.0035
        } else if(bear.scene.position.y <= -0.5){
          bearTransition = -0.0035
        }

        renderer.render(scene, camera);
    });
  }
  start();
});
