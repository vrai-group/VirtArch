window.onload = function()
{
	if (!Detector.webgl) Detector.addGetWebGLMessage();
	var camera, scene, renderer, dirLight, dirLight2, hemiLight;
	var controls;
	var mouseVector = new THREE.Vector3();
	var raycaster = new THREE.Raycaster();
	var tooltip;
	var mappa = document.getElementById('mappa');
	var mappaI = document.getElementById('mappaI');
	var tween, tweenebbia;
	var ground;	
	
	var indiceLuce = 0;
	var indiceCamera = 0;
	var indiceModelli;
	
	var moved = false,
        pos = {x: null, y: null};

    var listaLuci = [
	{ position: [-5, 8.75, 5],
          color: [0.1, 1, 0.70],
          sunIntensity: 1.0,
          ambientIntensity: 1.0
        },        
	{ position: [-9.0, 15.0, 30.0],
          color: [0.05, 0.25, 1],
          sunIntensity: 1.75,
          ambientIntensity: 1.5
        },
		{ position: [-9.0, 50.0, 30.0],
          color: [0.05, 0.25, 1],
          sunIntensity: 1.75,
          ambientIntensity: 1.5
        },
		{ position: [-30.0, 10.0, 30.0],
          color: [0.05, 0.25, 1],
          sunIntensity: 1.0,
          ambientIntensity: 1.0
        }
    ];

    var listaCam = [
		{ x: 0, y: 50, z: 80 },
		{ x: 80, y: 50, z: 0 },
		{ x: 0, y: 50, z: -80 },
		{ x: -80, y: 50, z: 0 }
	];
	
	var cameraStruttura =
		{ fov: 30, x: 0, y: 50, z: 80 };
		
	var ultimoOggettoCaricato;
	
    var modelli = [
		{mtl: 'e1.obj.mtl', obj:'e1.obj'},
		{mtl: 'e2.obj.mtl', obj:'e2.obj'},
		{mtl: null, obj:'e3.PNG'},
		{mtl: null, obj:'e4.PNG'},
		{mtl: 'i1.obj.mtl', obj:'i1.obj'},
		{mtl: null, obj:'i2.PNG'},		
		{mtl: 'i3.obj.mtl', obj:'i3.obj'},				
		{mtl: 'i4.obj.mtl', obj:'i4.obj'},
		{mtl: null, obj:'i5.PNG'},
		{mtl: null, obj:'i6.PNG'},
		{mtl: null, obj:'i7.PNG'}		
		];	

    var pulsanteCamera = document.getElementsByClassName('pulsante-camera')[0];
    var pulsanteSchermoIntero = document.getElementsByClassName('pulsante-fullscreen')[0];
    var pulsanteIndietro = document.getElementsByClassName('pulsante-indietro')[0];
	
    var Click=false;    
    var slider = document.getElementById('slider');
    var contenutoDivConStruttura = "press <strong>h</strong> to toggle hemisphere light, <strong>d</strong> to toggle directional light,<br><strong>l</strong> to change lighting, <strong>c</strong> to change camera. Hold <strong>left click</strong> to rotate.";
	var contenutoDivSenzaStruttura = "press <strong>h</strong> to toggle hemisphere light, <strong>d</strong> to toggle directional light,<br><strong>l</strong> to change lighting. Hold <strong>left click</strong> to rotate, hold <strong>right click</strong> to move horizontally or vertically.";
	var header = document.getElementById("header"); 
	
    var posizionePerRicomparsaStruttura;
    var hack = document.getElementById("hack");
    init();
    animate();	

    function init()
	{
		var container = document.getElementById('container');
		camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 5000);
		//console.log(camera.fov);
		//camera.position.set(0, 0, 250);
		camera.position.set(0, 0, 5); //posizione per il bassorilievo
		scene = new THREE.Scene();
		scene.fog = new THREE.FogExp2(0xb2e1f2, 0.0004);

		// LUCE DAGLI EMISFERI (ILLUMINA DA SOTTO GLI OGGETTI)
		hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
		hemiLight.color.setHSL(0.6, 1, 0.6);
		hemiLight.groundColor.setHSL(0.095, 1, 0.75);
		hemiLight.position.set(0, 500, 0);
		scene.add(hemiLight);
		// SOLE
		dirLight = new THREE.DirectionalLight(0xffffff, 1);
		dirLight.color.setHSL(0.1, 1, 0.70);
		dirLight.position.set(-1, 1.75, 1);
		dirLight.position.multiplyScalar(50);
		scene.add(dirLight);
		dirLight2 = new THREE.DirectionalLight(0xffffff, 1);
		dirLight2.color.setHSL(0.1, 1, 0.70);
		dirLight2.position.set(-1, 1.75, -1);
		dirLight2.position.multiplyScalar(50);
		scene.add(dirLight2);
		// PER L'OMBRA
		dirLight.castShadow = true;
		dirLight.shadow.mapSize.width = 2048;
		dirLight.shadow.mapSize.height = 2048;
		var d = 50;
		dirLight.shadow.camera.left = -d;
		dirLight.shadow.camera.right = d;
		dirLight.shadow.camera.top = d;
		dirLight.shadow.camera.bottom = -d;
		dirLight.shadow.camera.far = 3500;
		dirLight.shadow.bias = -0.0001;
		// TERRENO
		var groundGeo = new THREE.PlaneBufferGeometry(10000, 10000);
		var texture = THREE.ImageUtils.loadTexture('textures/sabbia.jpg');
		texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
		texture.repeat.multiplyScalar(128);
		texture.anisotropy = 4;
		var material = new THREE.MeshPhongMaterial(
		{
			color: 0xffffff,
			map: texture
		});
		material.color.setHSL(0.095, 1, 0.75);
		ground = new THREE.Mesh(groundGeo, material);
		ground.rotation.x = -Math.PI / 2;
		ground.position.y = 3;
		scene.add(ground);
		ground.receiveShadow = true;


		//l'animazione iniziale parte da x=-200 e termina a (0,0,0)
		posizionePerRicomparsaStruttura = {
			x: -200,
			z: 0
		};

		//
		// RENDERER
		renderer = new THREE.WebGLRenderer(
		{
			antialias: true
		});


		// CIELO (Sfondo renderer)
		renderer.setClearColor(0xb2e1f2);
		//

		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setSize(window.innerWidth, window.innerHeight);
		container.appendChild(renderer.domElement);
		renderer.gammaInput = true;
		renderer.gammaOutput = true;
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.cullFace = THREE.CullFaceBack;


		// OrbitControls
		controls = new THREE.OrbitControls(camera, renderer.domElement);

		caricaOggetto('obj/Struttura.obj.mtl', 'obj/Struttura.obj', posizionePerRicomparsaStruttura.x, 0, posizionePerRicomparsaStruttura.z, cameraStruttura.fov, cameraStruttura.x, cameraStruttura.y, cameraStruttura.z, 40, 100, -10, 10, -10, 10, false, 0, 1.4);


		//gestione click oggetti		
		window.addEventListener('mousemove', onMouseMove, false);
		window.addEventListener('click', mouseClick, false);
		window.addEventListener('mouseup', mouseUp, false);
		window.addEventListener('mousedown', mouseDown, false);

		document.addEventListener("contextmenu", function(e)
		{
			e.preventDefault();
		}, false);

		window.addEventListener('resize', onWindowResize, false);
		document.addEventListener('keydown', onKeyDown, false);

		//Tooltip
		tooltip = document.createElement('div');
		tooltip.setAttribute("class", "tooltip");
		document.body.appendChild(tooltip);



	}

	function animazioneOggetto(effetto)
	{

		var oggettoDaAnimare = scene.getObjectByName(ultimoOggettoCaricato);

		switch (effetto)
		{
			case "comparsa":

				var target = {
					x: 0,
					z: 0
				};

				if (ultimoOggettoCaricato == "obj/Struttura.obj")
					var nebbia = {
						density: 0.0004
					}
				else
					var nebbia = {
						density: 0.004
					}
				tweenebbia = new TWEEN.Tween(scene.fog).to(nebbia, 1500);

				break;
			case "scomparsa":

				var somma = Math.abs(camera.position.x) + Math.abs(camera.position.z);
				var destinazioneNormalizzata = camera.position.clone();
				var appoggio = destinazioneNormalizzata.x;
				destinazioneNormalizzata.x = destinazioneNormalizzata.z / somma * 200;
				destinazioneNormalizzata.z = -appoggio / somma * 200;

				var target = {
					x: destinazioneNormalizzata.x,
					z: destinazioneNormalizzata.z
				};

				if (ultimoOggettoCaricato == "obj/Struttura.obj")
					posizionePerRicomparsaStruttura = {
						x: -destinazioneNormalizzata.x,
						z: -destinazioneNormalizzata.z
					}
				var nebbia = {
					density: 0.04
				}
				tweenebbia = new TWEEN.Tween(scene.fog).to(nebbia, 1500);

				break;
			default:
				console.error('Errore:\nil parametro \"' + effetto + '\" passato alla funzione animazioneOggetto(effetto) non è valido!');
		}

		tween = new TWEEN.Tween(oggettoDaAnimare.position).to(target, 1500);
		tween.easing(TWEEN.Easing.Exponential.EaseInOut);
		tweenebbia.easing(TWEEN.Easing.Exponential.EaseInOut);
		tween.start();
		tweenebbia.start();
	}




	function onWindowResize()
	{
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
	}

	function onKeyDown(event)
	{
		switch (event.keyCode)
		{
			case 72: // h
				hemiLight.visible = !hemiLight.visible;
				break;
			case 68: // d
				dirLight.visible = !dirLight.visible;
				dirLight2.visible = !dirLight2.visible;
				break;
			case 76: // l
				cambiaLuce();
				break;
			case 67: // c
				if (ultimoOggettoCaricato == "obj/Struttura.obj")
					cambiaCamera();
				break;
		}
	}

	function onMouseMove(e)
	{

		mouseVector.x = 2 * (e.clientX / container.clientWidth) - 1;
		mouseVector.y = 1 - 2 * (e.clientY / container.clientHeight);

		//Per visualizzare nella corretta posizione il tooltip
		X = e.clientX + 4;
		Y = e.clientY - 40;
		tooltip.style.top = Y + 'px';
		tooltip.style.left = X + 'px';
		tooltip.innerHTML = "";

		var oggetti = scene.getObjectByName('obj/Struttura.obj');
		if (typeof oggetti != 'undefined')
		{
			raycaster.setFromCamera(mouseVector.clone(), camera);
			intersects = raycaster.intersectObjects(oggetti.children);

			oggetti.children.forEach(function(oggetto)
			{
				if (oggetto.name != 'default')
				{
					oggetto.material.transparent = false;
					oggetto.material.color.setRGB(0.49, 0.30, 0.1);
				}
			});


			if (intersects.length > 0)
			{
				var intersection = intersects[0];
				oggetto = intersection.object;

				if (oggetto.name != 'default')
				{
					tooltip.innerHTML = oggetto.name;
					oggetto.material.transparent = true;
					oggetto.material.opacity = 0.95;
					oggetto.material.color.setRGB(1, 1, 1);
				}
			}
		}
	}

	function mouseClick(e)
	{
		tooltip.innerHTML = "";
		if (moved)
		{
			return;
		}

		mouseVector.x = 2 * (e.clientX / container.clientWidth) - 1;
		mouseVector.y = 1 - 2 * (e.clientY / container.clientHeight);

		var oggetti = scene.getObjectByName('obj/Struttura.obj');

		if (typeof oggetti != 'undefined')
		{

			var inters = oggetti.clone();
			var intersezioni = inters.children;

			//intersezioni.push(struttura.children[0]);
			raycaster.setFromCamera(mouseVector.clone(), camera);
			intersects = raycaster.intersectObjects(intersezioni);

			if (intersects.length > 0)
			{

				var intersection = intersects[0],
					obj = intersection.object;
				var nome = obj.name;
				switch (nome)
				{
					case "E1":
						indiceModelli = 0;
						gestisciPulsanti("nascondi");
						animazioneOggetto("scomparsa");
						modello = modelli[indiceModelli];
						selezionaBassorilievoSlider('E1');
						mappaI.src = "./images/Mappa/E1.jpg";
						tween.onComplete(function()
						{
							scene.remove(oggetti);
							cameraStruttura.fov = camera.fov;
							cameraStruttura.x = camera.position.x;
							cameraStruttura.y = camera.position.y;
							cameraStruttura.z = camera.position.z;
							pulsanteIndietro.addEventListener('click', clickIndietro);
							controls.reset();
							caricaOggetto('obj/' + modello.mtl, 'obj/' + modello.obj, -40, 0, 0, 30, 0, 0, 12, 2, 12, -5.5, 5.5, -1, 1, false, 0.57, 2.14, -0.8, 0.8);
						});

						break;
					case "E2":
						indiceModelli = 1;
						gestisciPulsanti("nascondi");
						animazioneOggetto("scomparsa");
						modello = modelli[indiceModelli];
						selezionaBassorilievoSlider('E2');
						mappaI.src = "./images/Mappa/E2.jpg";
						tween.onComplete(function()
						{
							scene.remove(oggetti);
							cameraStruttura.fov = camera.fov;
							cameraStruttura.x = camera.position.x;
							cameraStruttura.y = camera.position.y;
							cameraStruttura.z = camera.position.z;
							pulsanteIndietro.addEventListener('click', clickIndietro);
							controls.reset();
							caricaOggetto('obj/' + modello.mtl, 'obj/' + modello.obj, -40, 0, 0, 30, 0, 0, 28, 2, 28, -15, 15, -1.6, 1.92, false, 1.3, 1.8, -0.8, 0.8);
						});
						break;
					case "E4":
						indiceModelli = 3;
						gestisciPulsanti("nascondi");
						animazioneOggetto("scomparsa");
						modello = modelli[indiceModelli];
						selezionaBassorilievoSlider('E4');
						mappaI.src = "./images/Mappa/E4.jpg";
						tween.onComplete(function()
						{
							scene.remove(oggetti);
							cameraStruttura.fov = camera.fov;
							cameraStruttura.x = camera.position.x;
							cameraStruttura.y = camera.position.y;
							cameraStruttura.z = camera.position.z;
							pulsanteIndietro.addEventListener('click', clickIndietro);
							controls.reset();
							caricaOggetto('obj/' + modello.mtl, 'obj/' + modello.obj, -40, 0, 0, 30, 0, 0, 23, 4, 23, -11, 11, -1, 1, true, Math.PI / 2, Math.PI / 2, 0, 0, 26, 3);
						});
						break;
					case "I1":
						indiceModelli = 4;
						gestisciPulsanti("nascondi");
						animazioneOggetto("scomparsa");
						modello = modelli[indiceModelli];
						selezionaBassorilievoSlider('I1');
						mappaI.src = "./images/Mappa/I1.jpg";
						tween.onComplete(function()
						{
							scene.remove(oggetti);
							cameraStruttura.fov = camera.fov;
							cameraStruttura.x = camera.position.x;
							cameraStruttura.y = camera.position.y;
							cameraStruttura.z = camera.position.z;
							pulsanteIndietro.addEventListener('click', clickIndietro);
							controls.reset();
							caricaOggetto('obj/' + modello.mtl, 'obj/' + modello.obj, -40, 0, 0, 30, 0, 0, 6, 2, 6, -2, 2, -0.5, 0.5, false, 0.57, 2.14, -0.8, 0.8);
						});
						break;

					case "I3":
						indiceModelli = 6;
						gestisciPulsanti("nascondi");
						animazioneOggetto("scomparsa");
						modello = modelli[indiceModelli];
						selezionaBassorilievoSlider('I3');
						mappaI.src = "./images/Mappa/I3.jpg";
						tween.onComplete(function()
						{
							scene.remove(oggetti);
							cameraStruttura.fov = camera.fov;
							cameraStruttura.x = camera.position.x;
							cameraStruttura.y = camera.position.y;
							cameraStruttura.z = camera.position.z;
							pulsanteIndietro.addEventListener('click', clickIndietro);
							controls.reset();
							caricaOggetto('obj/' + modello.mtl, 'obj/' + modello.obj, -40, 0.1, 0, 30, 0, 0, 10, 2, 10, -1.6, 1.92, -1, 1.2, false, 0.57, 2.14, -0.8, 0.8);
						});
						break;
					case "I4":
						indiceModelli = 7;
						gestisciPulsanti("nascondi");
						animazioneOggetto("scomparsa");
						modello = modelli[indiceModelli];
						selezionaBassorilievoSlider('I4');
						mappaI.src = "./images/Mappa/I4.jpg";
						tween.onComplete(function()
						{
							scene.remove(oggetti);
							cameraStruttura.fov = camera.fov;
							cameraStruttura.x = camera.position.x;
							cameraStruttura.y = camera.position.y;
							cameraStruttura.z = camera.position.z;
							pulsanteIndietro.addEventListener('click', clickIndietro);
							controls.reset();
							caricaOggetto('obj/' + modello.mtl, 'obj/' + modello.obj, -40, 0, 0, 30, 0, 0, 10, 2, 10, -2.1, 2, -1, 1, false, 0.57, 2.14, -0.8, 0.8);
						});
						break;
					case "I5":
						indiceModelli = 8;
						gestisciPulsanti("nascondi");
						animazioneOggetto("scomparsa");
						modello = modelli[indiceModelli];
						selezionaBassorilievoSlider('I5');
						mappaI.src = "./images/Mappa/I5.jpg";
						tween.onComplete(function()
						{
							scene.remove(oggetti);
							cameraStruttura.fov = camera.fov;
							cameraStruttura.x = camera.position.x;
							cameraStruttura.y = camera.position.y;
							cameraStruttura.z = camera.position.z;
							pulsanteIndietro.addEventListener('click', clickIndietro);
							controls.reset();
							caricaOggetto('obj/' + modello.mtl, 'obj/' + modello.obj, -40, 0, 0, 30, 0, 0, 25, 4, 25, -15, 15, -2, 3, true, Math.PI / 2, Math.PI / 2, 0, 0, 25, 8);
						});
						break;
					case "I6":
						indiceModelli = 9;
						gestisciPulsanti("nascondi");
						animazioneOggetto("scomparsa");
						modello = modelli[indiceModelli];
						selezionaBassorilievoSlider('I6');
						mappaI.src = "./images/Mappa/I6.jpg";
						tween.onComplete(function()
						{
							scene.remove(oggetti);
							cameraStruttura.fov = camera.fov;
							cameraStruttura.x = camera.position.x;
							cameraStruttura.y = camera.position.y;
							cameraStruttura.z = camera.position.z;
							pulsanteIndietro.addEventListener('click', clickIndietro);
							controls.reset();
							caricaOggetto('obj/' + modello.mtl, 'obj/' + modello.obj, -40, 0, 0, 30, 0, 0, 22, 4, 22, -5, 5, -1, 1, true, Math.PI / 2, Math.PI / 2, 0, 0, 7.5, 6);
						});
						break;
					case "I7":
						indiceModelli = 10;
						gestisciPulsanti("nascondi");
						animazioneOggetto("scomparsa");
						modello = modelli[indiceModelli];
						selezionaBassorilievoSlider('I7');
						mappaI.src = "./images/Mappa/I7.jpg";
						tween.onComplete(function()
						{
							scene.remove(oggetti);
							cameraStruttura.fov = camera.fov;
							cameraStruttura.x = camera.position.x;
							cameraStruttura.y = camera.position.y;
							cameraStruttura.z = camera.position.z;
							pulsanteIndietro.addEventListener('click', clickIndietro);
							controls.reset();
							caricaOggetto('obj/' + modello.mtl, 'obj/' + modello.obj, -40, 0, 0, 30, 0, 0, 22, 4, 22, -11, 11, -1, 1, true, Math.PI / 2, Math.PI / 2, 0, 0, 18, 3.5);
						});
						break;
				}

			}
		}
	}

	function mouseUp(e)
	{
		moved = Math.abs(pos.x - e.pageX) > 3 || Math.abs(pos.y - e.pageY) > 3;
	}

	function mouseDown(e)
	{
		pos.x = e.pageX;
		pos.y = e.pageY;
		moved = false;
	}


	//
	function animate()
	{
		requestAnimationFrame(animate);
		render();
		TWEEN.update();
	}

	function render()
	{

		//OrbitControls
		controls.update();

		renderer.render(scene, camera);
	}

	function cambiaLuce()
	{

		indiceLuce = (indiceLuce + 1) % listaLuci.length;

		var lighting = listaLuci[indiceLuce];
		var position = lighting.position;
		var color = lighting.color;

		dirLight.intensity = lighting.sunIntensity;
		dirLight.ambientIntensity = lighting.ambientIntensity;

		dirLight.position.set(position[0], position[1], position[2]).multiplyScalar(10);
		dirLight.color.setHSL(color[0], color[1], color[2]);
	}

	function cambiaCamera()
	{

		indiceCamera = (indiceCamera + 1) % listaCam.length;

		var parametriCamera = listaCam[indiceCamera];

		var animazioneCamera = new TWEEN.Tween(camera.position).to(
		{
			x: parametriCamera.x,
			y: parametriCamera.y,
			z: parametriCamera.z
		}, 600).easing(TWEEN.Easing.Sinusoidal.EaseInOut).start();

	}

	function caricaOggetto(mtl, obj, posX, posY, posZ, fov, camX, camY, camZ, minD, maxD, minLimX, maxLimX, minLimY, maxLimY, flag, minPol, maxPol, minAz, maxAz, dimX, dimY)
	{
		flag = typeof flag === 'undefined' ? false : flag;
		minPol = typeof minPol === 'undefined' ? 0 : minPol;
		maxPol = typeof maxPol === 'undefined' ? Math.PI : maxPol;
		minAz = typeof minAz === 'undefined' ? -Infinity : minAz;
		maxAz = typeof maxAz === 'undefined' ? Infinity : maxAz;
		dimX = typeof dimX === 'undefined' ? null : dimX;
		dimY = typeof dimY === 'undefined' ? null : dimY;
		
		
		var object;
		if (!flag)
		{
			var mtlLoader = new THREE.MTLLoader();
			mtlLoader.setBaseUrl('obj/');
			mtlLoader.load(mtl, function(materials)
			{

				materials.preload();

				var objLoader = new THREE.OBJLoader();
				objLoader.setMaterials(materials);
				objLoader.load(obj, function(object)
				{

					object.position.set(posX, posY, posZ);

					object.traverse(function(child)
					{
						if (child instanceof THREE.Mesh)
						{
							child.castShadow = true;
							child.receiveShadow = true;
							child.material.side = THREE.DoubleSide;
						}
					});
					scene.add(object);
					object.name = obj;
				});
			});
		}
		else
		{
			var geometry = new THREE.PlaneGeometry(dimX, dimY);
			var material = new THREE.MeshLambertMaterial(
			{
				transparent: true,
				map: THREE.ImageUtils.loadTexture(obj)
			});
			var object = new THREE.Mesh(geometry, material);
			object.position.x = posX;
			object.position.y = posY;
			object.position.z = posZ;
			scene.add(object);
			object.name = obj;
		}
		camera.fov = fov;
		camera.position.set(camX, camY, camZ);

		controls.minDistance = minD;
		controls.maxDistance = maxD;

		controls.setLimite(minLimX, maxLimX, minLimY, maxLimY);

		controls.minPolarAngle = minPol;
		controls.maxPolarAngle = maxPol;

		controls.minAzimuthAngle = minAz;
		controls.maxAzimuthAngle = maxAz;
		ultimoOggettoCaricato = obj;
		camera.updateProjectionMatrix();
	}

	function gestisciPulsanti(contesto)
	{
		switch (contesto)
		{
			case "struttura":
				pulsanteIndietro.style.visibility = "hidden";
				pulsanteCamera.style.visibility = "visible";
				slider.style.visibility = "hidden";
				hack.style.visibility = "hidden";
				header.innerHTML = contenutoDivConStruttura;
				mappa.style.visibility = "hidden";
				window.addEventListener('click', mouseClick, false);
				break;
			case "bassorilievo":
				pulsanteIndietro.style.visibility = "visible";
				pulsanteCamera.style.visibility = "hidden";
				slider.style.visibility = "visible";
				hack.style.visibility = "visible";
				mappa.style.visibility = "visible";
				header.innerHTML = contenutoDivSenzaStruttura;
				break;
			case "nascondi":
				window.removeEventListener("click", mouseClick);
				controls.autoRotate = false;
				pulsanteIndietro.style.visibility = "hidden";
				pulsanteCamera.style.visibility = "hidden";
				slider.style.visibility = "hidden";
				hack.style.visibility = "hidden";
				mappa.style.visibility = "hidden";
				break;
			default:
				console.error('Errore:\nil parametro \"' + contesto + '\" passato alla funzione gestisciPulsanti(contesto) non è valido!');
		}
	}



	THREE.DefaultLoadingManager.onProgress = function(item, loaded, total)
	{

		var canvas = document.getElementsByTagName("canvas")[0];
		canvas.className = "caricamento";
		var cerchio = document.getElementsByClassName('cerchio')[0];
		cerchio.style.visibility = "visible";
		var percentuale = Math.floor((loaded / total) * 100);
		document.getElementById('percentuale').innerHTML = percentuale + "%";
		//console.log(percentuale);
		if (percentuale <= 50)
		{
			document.getElementsByClassName('bar')[0].style.transform = "rotate(" + percentuale * 3.6 + "deg)";
			document.getElementsByClassName('settoreCircolare')[0].style.transform = "rotate(0deg)";
			document.getElementsByClassName('settoreCircolare')[0].style.position = "absolute";

		}
		else
		{
			document.getElementsByClassName('bar')[0].style.transform = "rotate(" + (percentuale - 50) * 3.6 + "deg)";
			document.getElementsByClassName('settoreCircolare')[0].style.transform = "rotate(180deg)";
			document.getElementsByClassName('settoreCircolare')[0].style.position = "relative";

		}
		if (loaded == total)
		{
			console.log("item: ")
			console.log(item);
			cerchio.style.visibility = "hidden";
			canvas.className = "fatto";
			animazioneOggetto("comparsa");
			if (item == 'obj/Struttura.obj')
			{				
				ground.position.y=3;				
				tween.onComplete(function()
				{	
					gestisciPulsanti("struttura");
				});
			}
			else
			{
				ground.position.y=-33;
				tween.onComplete(function()
				{	
					gestisciPulsanti("bassorilievo");
				});
			}
		}

	};

	pulsanteCamera.addEventListener('click', toggleAutoRotazione);

	function toggleAutoRotazione()
	{
		controls.autoRotate = !controls.autoRotate;
	}

	pulsanteSchermoIntero.addEventListener('click', toggleFullScreen);

	function toggleFullScreen()
	{
		if ((document.fullScreenElement && document.fullScreenElement !== null) || (!document.mozFullScreen && !document.webkitIsFullScreen))
		{
			if (document.documentElement.requestFullScreen)
			{
				document.documentElement.requestFullScreen();
			}
			else if (document.documentElement.mozRequestFullScreen)
			{
				document.documentElement.mozRequestFullScreen();
			}
			else if (document.documentElement.webkitRequestFullScreen)
			{
				document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
			}
		}
		else
		{
			if (document.cancelFullScreen)
			{
				document.cancelFullScreen();
			}
			else if (document.mozCancelFullScreen)
			{
				document.mozCancelFullScreen();
			}
			else if (document.webkitCancelFullScreen)
			{
				document.webkitCancelFullScreen();
			}
		}
	}

	function clickIndietro()
	{
		var bassorilievo = scene.getObjectByName(ultimoOggettoCaricato);
		gestisciPulsanti("nascondi");

		animazioneOggetto("scomparsa");

		tween.onComplete(function()
		{
			scene.remove(bassorilievo);
			controls.reset();
			caricaOggetto('obj/Struttura.obj.mtl', 'obj/Struttura.obj', posizionePerRicomparsaStruttura.x, 0, posizionePerRicomparsaStruttura.z, cameraStruttura.fov, cameraStruttura.x, cameraStruttura.y, cameraStruttura.z, 40, 100, -10, 10, -10, 10, false, 0, 1.4)
		});
	}

	//SLIDER!
	var sliderX = document.getElementsByClassName('showcase-thumbnail-wrapper-horizontal')[0];
	var posizioniSlide = [0, -238, -476, -714, -952, -1190, -1428, -1666];
	var posizioneAttuale = 0;
	var pulsanteIndietroX = document.getElementsByClassName('showcase-thumbnail-button-backward')[0];
	pulsanteIndietroX.addEventListener('click', indietroX);
	var pulsanteAvanti = document.getElementsByClassName('showcase-thumbnail-button-forward')[0];
	pulsanteAvanti.addEventListener('click', avanti);

	var destinazione;

	function indietroX()
	{
		start = posizioniSlide[posizioneAttuale];
		destinazione = posizioniSlide[posizioneAttuale = (posizioneAttuale + 7) % 8];
		anima();
	}

	function avanti()
	{
		start = posizioniSlide[posizioneAttuale];
		destinazione = posizioniSlide[posizioneAttuale = (posizioneAttuale + 1) % 8];
		anima();
	}

	function anima()
	{
		var animazione = new TWEEN.Tween(
			{
				left: start
			})
			.to(
			{
				left: destinazione
			}, 300)
			.onUpdate(function()
			{
				sliderX.style.left = this.left + 'px';
			});

		animazione.start();
	}

	//evidenzio il thumbnail selezionato e de-evidenzio quello precedentemente evidenziato
	var anteprime = document.getElementsByClassName('showcase-thumbnail-wrapper')[0].childNodes;
	for (var i = 0; i < anteprime.length; i++)
	{
		var el = anteprime.item(i);
		el.onclick = function(e)
		{
			if (!Click)
			{
				Click = true;
				rimuoviClasse(document.getElementsByClassName('active')[0], 'active');
				e.target.parentNode.classList.add('active');
				//effettuo il regex sulla src dell'immagine ed estraggo il primo match e la sottostringa da indice 0 a indice 2
				//es percorso/dell_immagine/immagineE1.jpg ---> matcha E1.jpg ed estrae la sottostringa E1
				//che identificherà il bassorilievo esterno 1
				var oggetto = scene.getObjectByName(ultimoOggettoCaricato);
				var regex = e.target.src.match(/(E|I)([1-9])(.jpg)/ig)[0].substring(0, 2);
				var controllo = oggetto.name.match(/(E|I)([1-9])(.png|.obj)/ig)[0].substring(0, 2);
				console.log("regex e controllo: ");
				console.log(regex.toUpperCase());
				console.log(controllo.toUpperCase());
				if (!(regex.toUpperCase() === controllo.toUpperCase()))
				{
					switch (regex)
					{
						case "E1":
							indiceModelli = 0;
							gestisciPulsanti("nascondi");
							animazioneOggetto("scomparsa");
							modello = modelli[indiceModelli];
							mappaI.src = "./images/Mappa/E1.jpg";
							tween.onComplete(function()
							{
								scene.remove(oggetto);
								controls.reset();
								caricaOggetto('obj/' + modello.mtl, 'obj/' + modello.obj, -40, 0, 0, 30, 0, 0, 12, 2, 12, -5.5, 5.5, -1, 1, false, 0.57, 2.14, -0.8, 0.8);
								Click = false;
							});
							break;
						case "E2":
							indiceModelli = 1;
							gestisciPulsanti("nascondi");
							animazioneOggetto("scomparsa");
							modello = modelli[indiceModelli];
							mappaI.src = "./images/Mappa/E2.jpg";
							tween.onComplete(function()
							{
								scene.remove(oggetto);
								controls.reset();
								caricaOggetto('obj/' + modello.mtl, 'obj/' + modello.obj, -40, 0, 0, 30, 0, 0, 28, 2, 28, -15, 15, -1.6, 1.92, false, 1.3, 1.8, -0.8, 0.8);
								Click = false;
							});
							break;
						case "E3":
							indiceModelli = 2;
							gestisciPulsanti("nascondi");
							animazioneOggetto("scomparsa");
							modello = modelli[indiceModelli];
							mappaI.src = "./images/Mappa/E3.jpg";
							tween.onComplete(function()
							{
								scene.remove(oggetto);
								controls.reset();
								caricaOggetto('obj/' + modello.mtl, 'obj/' + modello.obj, -40, 0, 0, 30, 0, 0, 27, 6, 27, -12, 12, -1, 0.1, true, Math.PI / 2, Math.PI / 2, 0, 0, 29.66, 3.59);
								Click = false;
							});
							break;
						case "E4":
							indiceModelli = 3;
							gestisciPulsanti("nascondi");
							animazioneOggetto("scomparsa");
							modello = modelli[indiceModelli];
							mappaI.src = "./images/Mappa/E4.jpg";
							tween.onComplete(function()
							{
								scene.remove(oggetto);
								controls.reset();
								caricaOggetto('obj/' + modello.mtl, 'obj/' + modello.obj, -40, 0, 0, 30, 0, 0, 23, 4, 23, -11, 11, -1, 1, true, Math.PI / 2, Math.PI / 2, 0, 0, 26, 3);
								Click = false;
							});
							break;
						case "I1":
							indiceModelli = 4;
							gestisciPulsanti("nascondi");
							animazioneOggetto("scomparsa");
							modello = modelli[indiceModelli];
							mappaI.src = "./images/Mappa/I1.jpg";
							tween.onComplete(function()
							{
								scene.remove(oggetto);
								controls.reset();
								caricaOggetto('obj/' + modello.mtl, 'obj/' + modello.obj, -40, 0, 0, 30, 0, 0, 6, 2, 6, -2, 2, -0.5, 0.5, false, 0.57, 2.14, -0.8, 0.8);
								Click = false;
							});
							break;
						case "I2":
							indiceModelli = 5;
							gestisciPulsanti("nascondi");
							animazioneOggetto("scomparsa");
							modello = modelli[indiceModelli];
							mappaI.src = "./images/Mappa/I2.jpg";
							tween.onComplete(function()
							{
								scene.remove(oggetto);
								controls.reset();
								caricaOggetto('obj/' + modello.mtl, 'obj/' + modello.obj, -40, 0, 0, 30, 0, 0, 21, 4, 21, -10, 10, -1, 1, true, Math.PI / 2, Math.PI / 2, 0, 0, 23, 2.75);
								Click = false;
							});
							break;
						case "I3":
							indiceModelli = 6;
							gestisciPulsanti("nascondi");
							animazioneOggetto("scomparsa");
							modello = modelli[indiceModelli];
							mappaI.src = "./images/Mappa/I3.jpg";
							tween.onComplete(function()
							{
								scene.remove(oggetto);
								controls.reset();
								caricaOggetto('obj/' + modello.mtl, 'obj/' + modello.obj, -40, 0.1, 0, 30, 0, 0, 10, 2, 10, -1.6, 1.92, -1, 1.2, false, 0.57, 2.14, -0.8, 0.8);
								Click = false;
							});
							break;
						case "I4":
							indiceModelli = 7;
							gestisciPulsanti("nascondi");
							animazioneOggetto("scomparsa");
							modello = modelli[indiceModelli];
							mappaI.src = "./images/Mappa/I4.jpg";
							tween.onComplete(function()
							{
								scene.remove(oggetto);
								controls.reset();
								caricaOggetto('obj/' + modello.mtl, 'obj/' + modello.obj, -40, 0, 0, 30, 0, 0, 10, 2, 10, -2.1, 2, -1, 1, false, 0.57, 2.14, -0.8, 0.8);
								Click = false;
							});
							break;
						case "I5":
							indiceModelli = 8;
							gestisciPulsanti("nascondi");
							animazioneOggetto("scomparsa");
							modello = modelli[indiceModelli];
							mappaI.src = "./images/Mappa/I5.jpg";
							tween.onComplete(function()
							{
								scene.remove(oggetto);
								controls.reset();
								caricaOggetto('obj/' + modello.mtl, 'obj/' + modello.obj, -40, 0, 0, 30, 0, 0, 25, 4, 25, -15, 15, -2, 3, true, Math.PI / 2, Math.PI / 2, 0, 0, 25, 8);
								Click = false;
							});
							break;
						case "I6":
							indiceModelli = 9;
							gestisciPulsanti("nascondi");
							animazioneOggetto("scomparsa");
							modello = modelli[indiceModelli];
							mappaI.src = "./images/Mappa/I6.jpg";
							tween.onComplete(function()
							{
								scene.remove(oggetto);
								controls.reset();
								caricaOggetto('obj/' + modello.mtl, 'obj/' + modello.obj, -40, 0, 0, 30, 0, 0, 22, 4, 22, -5, 5, -1, 1, true, Math.PI / 2, Math.PI / 2, 0, 0, 7.5, 6);
								Click = false;
							});
							break;
						case "I7":
							indiceModelli = 10;
							gestisciPulsanti("nascondi");
							animazioneOggetto("scomparsa");
							modello = modelli[indiceModelli];
							mappaI.src = "./images/Mappa/I7.jpg";
							tween.onComplete(function()
							{
								scene.remove(oggetto);
								controls.reset();
								caricaOggetto('obj/' + modello.mtl, 'obj/' + modello.obj, -40, 0, 0, 30, 0, 0, 22, 4, 22, -11, 11, -1, 1, true, Math.PI / 2, Math.PI / 2, 0, 0, 18, 3.5);
								Click = false;
							});
							break;
					}
				}
				else Click = false;
			}
		};
	}

	function rimuoviClasse(el, className)
	{
		if (el.classList)
			el.classList.remove(className)
		else if (hasClass(el, className))
		{
			var reg = new RegExp('(\\s|^)' + className + '(\\s|$)')
			el.className = el.className.replace(reg, ' ')
		}
	}

	function selezionaBassorilievoSlider(bassorilievo)
	{
		rimuoviClasse(document.getElementsByClassName('active')[0], 'active');
		switch (bassorilievo)
		{
			case "E1":
				document.getElementById('showcase-thumbnail-0').classList.add('active');
				spostaInX(0);
				break;
			case "E2":
				document.getElementById('showcase-thumbnail-1').classList.add('active');
				spostaInX(1);
				break;
			case "E3":
				document.getElementById('showcase-thumbnail-2').classList.add('active');
				spostaInX(2);
				break;
			case "E4":
				document.getElementById('showcase-thumbnail-3').classList.add('active');
				spostaInX(3);
				break;
			case "I1":
				document.getElementById('showcase-thumbnail-4').classList.add('active');
				spostaInX(4);
				break;
			case "I2":
				document.getElementById('showcase-thumbnail-5').classList.add('active');
				spostaInX(5);
				break;
			case "I3":
				document.getElementById('showcase-thumbnail-6').classList.add('active');
				spostaInX(6);
				break;
			case "I4":
				document.getElementById('showcase-thumbnail-7').classList.add('active');
				spostaInX(7);
				break;
			case "I5":
				document.getElementById('showcase-thumbnail-8').classList.add('active');
				spostaInX(8);
				break;
			case "I6":
				document.getElementById('showcase-thumbnail-9').classList.add('active');
				spostaInX(9);
				break;
			case "I7":
				document.getElementById('showcase-thumbnail-10').classList.add('active');
				spostaInX(10);
				break;
			default:
				console.error('Errore:\nil parametro \"' + bassorilievo + '\" passato alla funzione selezionaBassorilievoSlider(bassorilievo) non è valido!');
		}
	}

	function spostaInX(indice)
	{
		if (indice > 7)
			indice = 7;
		destinazione = posizioniSlide[posizioneAttuale = (indice) % 8];
		sliderX.style.left = destinazione + "px";
	}

	slider.addEventListener("mouseover", onMouseOver, false);

	function onMouseOver(e)
	{
		slider.style.bottom = "25px";
	}

	slider.addEventListener("mouseleave", onMouseLeave, false);

	function onMouseLeave(e)
	{
		slider.style.bottom = "-100px";
	}

	hack.addEventListener("mouseover", onMouseOver, false);
	hack.addEventListener("mouseleave", onMouseLeave, false);
}
