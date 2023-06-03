let canvasWidth = 800;
let canvasHeight = 400;

const flock = [];
const mice = [];
const snake = [];

let miceCount = 0;
let snakeCount = 0;
let eagleCount = 0;

let alignSlider, cohesionSlider, separationSlider;
let populationEagle, populationMice, populationSnake;

let miceImg, snakeImg, eagleImg;

function preload() {
  miceImg = loadImage('tikus.png');
  snakeImg = loadImage('ularr.png');
  eagleImg = loadImage('elang.png');
  backgroundImage = loadImage('Sawah.jpg'); // Load the background image
}


function setup() {
  const canvas = createCanvas(canvasWidth, canvasHeight);
  canvas.parent('p5js-container');
  alignSlider = createSlider(0, 5, 0, 0.1);
  cohesionSlider = createSlider(0, 5, 0, 0.1);
  separationSlider = createSlider(0, 5, 0, 0.1);
  alignSlider.position(200,1800);
  cohesionSlider.position(350,1800);
  separationSlider.position(490,1800);


  input_elang = createInput(1)
  input_elang.position(230, 1430)
  input_elang.changed(populationEagle)

  input_snake = createInput(2)
  input_snake.position(230, 1455)
  input_snake.changed(populationSnake)

  input_mice = createInput(20)
  input_mice.position(230, 1480)
  input_mice.changed(populationMice)

  populationEagle();
  populationSnake();
  populationMice();

  function populationEagle() {
    pop = (input_elang.value())
    flock.splice(0, flock.length);
    for (let i = 0; i < pop; i++) {
      flock.push(new Eagle());
    }
    eagleCount=flock.length;
  }

  function populationSnake() {
    pop = (input_snake.value())
    snake.splice(0, snake.length);
    for (let i = 0; i < pop; i++) {
      snake.push(new Snake());
    }
    snakeCount=snake.length;
  }

  function populationMice() {
    pop = (input_mice.value())
    mice.splice(0, mice.length);
    for (let i = 0; i < pop; i++) {
      mice.push(new Mice());
    }
    miceCount=mice.length;
  }
}

function draw() {
  image(backgroundImage, 0, 0, 800, 400)
  textSize(10);
  fill(0);
  text(`Eagle Count: ${eagleCount}`, 200, 40);
  text(`Snake Count: ${snakeCount}`, 200, 65);
  text(`Mice Count: ${miceCount}`, 200, 90);

  fill("yellow")
  stroke(1)
  text("Masukkan Jumlah Populasi Yang Ingin Ditambahkan", 2, 15)
  text("AlignSlider", 2, 395)
  text("CohesionSlider", 140, 395)
  text("SeparationSlider", 270, 395)

  for (let boid of flock) {
    boid.edges();
    boid.flock(flock)
    boid.update();
    boid.show();
  }

  for (let boid of snake) {
    boid.edges();
    boid.flock(snake)
    boid.update();
    boid.show();
  }

  for (let boid of mice) {
    boid.edges();
    boid.flock(mice)
    boid.update();
    boid.show();
  }

  for (let eagle of flock) {
    for (let snak of snake) {
      if (eagle.collide(snak)) {
        eagleCount++;
        eagle.position.y = 10;
        eagle.velocity.x *= -1; // Reverse the x velocity
        setTimeout(flock.push(new Eagle()), 3000);
        snake.pop(snak);
        snakeCount--;
      }
    }
  }

  for (let snak of snake) {
    for (let tikus of mice) {
      if (snak.collide(tikus)) {
        snakeCount++;
        snak.velocity.x *= -1; // Reverse the x velocity
        mice.pop(tikus);
        miceCount--;
        setTimeout(snake.push(new Snake()), 3000);
      }
    }
  }
}

class Eagle { 
  constructor() {
    this.position = createVector(random(width), random(height));
    this.velocity = p5.Vector.random2D();
    this.velocity.setMag(random(2, 4)); //mengatur kecepatan acak antara 2-4
    this.radius=60;

    this.acceleration = createVector(); //percepatan awal nol
    this.maxForce = 0.2; // keterbatasan stir, belok menikuk tiap kendaraan berbeda
    this.maxSpeed = 5; //keterbatas kecepatan kendaraan
  }

  // ======= edges hanya untuk mengatasi keterbatasan canvas p5
  edges() {
    if (this.position.x < 0 || this.position.x > canvasWidth) {
      this.velocity.x *= -1; // Reverse the x velocity
      scale(-1, 1);
    }

    if (this.position.y < 0 || this.position.y > 400) {
      this.velocity.y *= -1; // Reverse the y velocity
    }
  }

  align(boids) { //argument boids (array)
    let perceptionRadius = 25;
    let steering = createVector(); // gaya kemudi, dibuat nol
    let total = 0; //untuk menghitung banyak kendaraan di sekiar radius 25

    //loop untuk menghitung jarak semua boid di sekitar radius 25
    for (let other of boids) {
      let d = dist(this.position.x, this.position.y, other.position.x, other.position.y);
      if (other != this && d < perceptionRadius) {
        steering.add(other.velocity); // menjumlah semua velocity
        total++;
      }
    }
    if (total > 0) {
      steering.div(total); // membagi total velocity dgn total (kec. rerata)
      steering.setMag(this.maxSpeed); // mengatur kec. max
      //ciri khas aligment
      steering.sub(this.velocity); //gaya kemudi = kec rata2 - kec. kendaraan
      steering.limit(this.maxForce); //mengatur kemudi/menikung maks
    }
    return steering;
  }

  //mirip dengan align
  separation(boids) {
    let perceptionRadius = 24;
    let steering = createVector();
    let total = 0;
    for (let other of boids) {
      let d = dist(this.position.x, this.position.y, other.position.x, other.position.y);
      if (other != this && d < perceptionRadius) {
        //ciri khas separation
        let diff = p5.Vector.sub(this.position, other.position); //vektor menjauh
        diff.div(d * d); // 1/r^2 (semakin dekat, semakin menjauh)
        steering.add(diff); // 
        total++;
      }
    }
    //mirip align
    if (total > 0) {
      steering.div(total);
      steering.setMag(this.maxSpeed);
      steering.sub(this.velocity);
      steering.limit(this.maxForce);
    }
    return steering;
  }

  cohesion(boids) {
    let perceptionRadius = 50;
    let steering = createVector();
    let total = 0;
    for (let other of boids) {
      let d = dist(this.position.x, this.position.y, other.position.x, other.position.y);
      if (other != this && d < perceptionRadius) {
        steering.add(other.position);
        total++;
      }
    }
    // cohesion dan aligment beda di sini
    // cohesion lebih pada posisi
    if (total > 0) {
      steering.div(total);
      steering.sub(this.position); //ciri khas cohesion
      steering.setMag(this.maxSpeed);
      steering.sub(this.velocity);
      steering.limit(this.maxForce);
    }
    return steering;
  }

  flock(boids) {
    let alignment = this.align(boids);
    let cohesion = this.cohesion(boids);
    let separation = this.separation(boids);

    alignment.mult(alignSlider.value());
    cohesion.mult(cohesionSlider.value());
    separation.mult(separationSlider.value());

    //akumulasi semua gaya akibat aligment, cohesion, dan separation
    this.acceleration.add(alignment);
    this.acceleration.add(cohesion);
    this.acceleration.add(separation);
  }

  update() {
    this.position.add(this.velocity);
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxSpeed);
    this.acceleration.mult(0); //accelerasionya direset setiap update
  }

  show() {
    strokeWeight(6);
    stroke(255);
    image(eagleImg, this.position.x, this.position.y, this.radius, this.radius);
  }

  collide(other) {
    let distance = p5.Vector.dist(this.position, other.position);
    return distance < this.radius + other.radius;
  }
}

class Mice {
  constructor() {
    this.position = createVector(random(canvasWidth), random(340, 400));
    this.velocity = createVector(random(-1, 5), random(-1, 1));
    this.velocity.setMag(random(2, 4)); //mengatur kecepatan acak antara 2-4
    this.radius=40;

    this.acceleration = createVector(); //percepatan awal nol
    this.maxForce = 0.2; // keterbatasan stir, belok menikuk tiap kendaraan berbeda
    this.maxSpeed = 5; //keterbatas kecepatan kendaraan
  }

  // ======= edges hanya untuk mengatasi keterbatasan canvas p5
  edges() {
    if (this.position.x < 0 || this.position.x > canvasWidth) {
      this.velocity.x *= -1; // Reverse the x velocity
      scale(-1, 1);
    }

    if (this.position.y < 300 || this.position.y > 380) {
      this.velocity.y *= -1; // Reverse the y velocity
    }
  }
  // ======= edges hanya untuk mengatasi keterbatasan canvas p5

  align(boids) { //argument boids (array)
    let perceptionRadius = 25;
    let steering = createVector(); // gaya kemudi, dibuat nol
    let total = 0; //untuk menghitung banyak kendaraan di sekiar radius 25

    //loop untuk menghitung jarak semua boid di sekitar radius 25
    for (let other of boids) {
      let d = dist(this.position.x, this.position.y, other.position.x, other.position.y);
      if (other != this && d < perceptionRadius) {
        steering.add(other.velocity); // menjumlah semua velocity
        total++;
      }
    }
    if (total > 0) {
      steering.div(total); // membagi total velocity dgn total (kec. rerata)
      steering.setMag(this.maxSpeed); // mengatur kec. max
      //ciri khas aligment
      steering.sub(this.velocity); //gaya kemudi = kec rata2 - kec. kendaraan
      steering.limit(this.maxForce); //mengatur kemudi/menikung maks
    }
    return steering;
  }

  //mirip dengan align
  separation(boids) {
    let perceptionRadius = 24;
    let steering = createVector();
    let total = 0;
    for (let other of boids) {
      let d = dist(this.position.x, this.position.y, other.position.x, other.position.y);
      if (other != this && d < perceptionRadius) {
        //ciri khas separation
        let diff = p5.Vector.sub(this.position, other.position); //vektor menjauh
        diff.div(d * d); // 1/r^2 (semakin dekat, semakin menjauh)
        steering.add(diff); // 
        total++;
      }
    }
    //mirip align
    if (total > 0) {
      steering.div(total);
      steering.setMag(this.maxSpeed);
      steering.sub(this.velocity);
      steering.limit(this.maxForce);
    }
    return steering;
  }

  cohesion(boids) {
    let perceptionRadius = 50;
    let steering = createVector();
    let total = 0;
    for (let other of boids) {
      let d = dist(this.position.x, this.position.y, other.position.x, other.position.y);
      if (other != this && d < perceptionRadius) {
        steering.add(other.position);
        total++;
      }
    }
    // cohesion dan aligment beda di sini
    // cohesion lebih pada posisi
    if (total > 0) {
      steering.div(total);
      steering.sub(this.position); //ciri khas cohesion
      steering.setMag(this.maxSpeed);
      steering.sub(this.velocity);
      steering.limit(this.maxForce);
    }
    return steering;
  }

  flock(boids) {
    let alignment = this.align(boids);
    let cohesion = this.cohesion(boids);
    let separation = this.separation(boids);

    alignment.mult(alignSlider.value());
    cohesion.mult(cohesionSlider.value());
    separation.mult(separationSlider.value());

    //akumulasi semua gaya akibat aligment, cohesion, dan separation
    this.acceleration.add(alignment);
    this.acceleration.add(cohesion);
    this.acceleration.add(separation);
  }

  update() {
    this.position.add(this.velocity);
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxSpeed);
    this.acceleration.mult(0); //accelerasionya direset setiap update
  }

  show() {
    strokeWeight(6);
    stroke(255);
    image(miceImg, this.position.x, this.position.y, this.radius, this.radius);
  }
}

class Snake {
  constructor() {
    this.position = createVector(random(canvasWidth), random(340, 400));
    this.velocity = createVector(random(-1, 5), random(-1, 1));
    this.velocity.setMag(random(2, 4)); //mengatur kecepatan acak antara 2-4
    this.radius=40;

    this.acceleration = createVector(); //percepatan awal nol
    this.maxForce = 0.2; // keterbatasan stir, belok menikuk tiap kendaraan berbeda
    this.maxSpeed = 5; //keterbatas kecepatan kendaraan
  }

  // ======= edges hanya untuk mengatasi keterbatasan canvas p5
  edges() {
    if (this.position.x < 0 || this.position.x > canvasWidth) {
      this.velocity.x *= -1; // Reverse the x velocity
      scale(-1, 1);
    }

    if (this.position.y < 300 || this.position.y > 400) {
      this.velocity.y *= -1; // Reverse the y velocity
    }
  }

  align(boids) { //argument boids (array)
    let perceptionRadius = 25;
    let steering = createVector(); // gaya kemudi, dibuat nol
    let total = 0; //untuk menghitung banyak kendaraan di sekiar radius 25

    //loop untuk menghitung jarak semua boid di sekitar radius 25
    for (let other of boids) {
      let d = dist(this.position.x, this.position.y, other.position.x, other.position.y);
      if (other != this && d < perceptionRadius) {
        steering.add(other.velocity); // menjumlah semua velocity
        total++;
      }
    }
    if (total > 0) {
      steering.div(total); // membagi total velocity dgn total (kec. rerata)
      steering.setMag(this.maxSpeed); // mengatur kec. max
      //ciri khas aligment
      steering.sub(this.velocity); //gaya kemudi = kec rata2 - kec. kendaraan
      steering.limit(this.maxForce); //mengatur kemudi/menikung maks
    }
    return steering;
  }

  //mirip dengan align
  separation(boids) {
    let perceptionRadius = 24;
    let steering = createVector();
    let total = 0;
    for (let other of boids) {
      let d = dist(this.position.x, this.position.y, other.position.x, other.position.y);
      if (other != this && d < perceptionRadius) {
        //ciri khas separation
        let diff = p5.Vector.sub(this.position, other.position); //vektor menjauh
        diff.div(d * d); // 1/r^2 (semakin dekat, semakin menjauh)
        steering.add(diff); // 
        total++;
      }
    }
    //mirip align
    if (total > 0) {
      steering.div(total);
      steering.setMag(this.maxSpeed);
      steering.sub(this.velocity);
      steering.limit(this.maxForce);
    }
    return steering;
  }

  cohesion(boids) {
    let perceptionRadius = 50;
    let steering = createVector();
    let total = 0;
    for (let other of boids) {
      let d = dist(this.position.x, this.position.y, other.position.x, other.position.y);
      if (other != this && d < perceptionRadius) {
        steering.add(other.position);
        total++;
      }
    }
    // cohesion dan aligment beda di sini
    // cohesion lebih pada posisi
    if (total > 0) {
      steering.div(total);
      steering.sub(this.position); //ciri khas cohesion
      steering.setMag(this.maxSpeed);
      steering.sub(this.velocity);
      steering.limit(this.maxForce);
    }
    return steering;
  }

  flock(boids) {
    let alignment = this.align(boids);
    let cohesion = this.cohesion(boids);
    let separation = this.separation(boids);

    alignment.mult(alignSlider.value());
    cohesion.mult(cohesionSlider.value());
    separation.mult(separationSlider.value());

    //akumulasi semua gaya akibat aligment, cohesion, dan separation
    this.acceleration.add(alignment);
    this.acceleration.add(cohesion);
    this.acceleration.add(separation);
  }

  update() {
    this.position.add(this.velocity);
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxSpeed);
    this.acceleration.mult(0); //accelerasionya direset setiap update
  }

  show() {
    strokeWeight(6);
    stroke(255);
    image(snakeImg, this.position.x, this.position.y, this.radius, this.radius);
  }

  collide(other) {
    let distance = p5.Vector.dist(this.position, other.position);
    return distance < this.radius + other.radius;
  }
}