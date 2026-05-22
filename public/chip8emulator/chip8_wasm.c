#include<stdlib.h>
#include<stdio.h>
#include<stdint.h>
#include<string.h>
#include<time.h>
#include<emscripten.h>

unsigned char fontset[80] = 
{
	0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
	0x20, 0x60, 0x20, 0x20, 0x70, // 1
	0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
	0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
	0x90, 0x90, 0xF0, 0x10, 0x10, // 4
	0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
	0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
	0xF0, 0x10, 0x20, 0x40, 0x40, // 7
	0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
	0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
	0xF0, 0x90, 0xF0, 0x90, 0x90, // A
	0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
	0xF0, 0x80, 0x80, 0x80, 0xF0, // C
	0xE0, 0x90, 0x90, 0x90, 0xE0, // D
	0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
	0xF0, 0x80, 0xF0, 0x80, 0x80  // F
};

typedef void (*js_callback_ptr)(int);

typedef struct {
  unsigned short opcode; // 2b
  unsigned char memory[4096]; // 4096b
  unsigned char V[16];  // 16b 16 x 8 bit
  unsigned short I; // 2b
  unsigned short pc; // 2b
  unsigned char gfx[64*32]; // ekran 64x32 kazdy pixel 1b
  unsigned short stack[16]; // stack 32b lacznie
  unsigned short sp; // pointer do stacka
  unsigned char key[16]; // lista inputow
  unsigned char delay_timer; // 1b
  unsigned char sound_timer; // 1b
  unsigned char render_flag;
  unsigned char running;
} Chip8;

Chip8 chip;

FILE *file_ptr;
#define ROMS_PATH "./roms/"


EMSCRIPTEN_KEEPALIVE
int load_rom_wasm(int rom_size, unsigned char rom_data[]) {
  if (rom_size > 4096 - 0x200) {
    printf("[Error] Couldn't load the ROM to the memory (OOM)");
    return -1;
  }else{
    memcpy(&chip.memory[0x200], rom_data, rom_size);
    printf("[+] ROM loaded via WASM: %d bytes\n", rom_size);
  }
  return 1;
} 

int load_rom(Chip8* chip, const char* rom_name) {
  const size_t path_len = strlen(rom_name) + sizeof(ROMS_PATH) + 1;
  char *file_path = calloc(path_len, sizeof(char));
  strcat(file_path, ROMS_PATH);
  strcat(file_path, rom_name);
  file_ptr = fopen(file_path, "rb");
  if (file_ptr == NULL) {
    printf("[Error] ROM's file not found\n");
    free(file_path);
    return -1;
  };
  fseek(file_ptr, 0, SEEK_END);
  const long file_size = ftell(file_ptr);
  rewind(file_ptr);
  if (file_size > 4096 - 0x200) {
    printf("[Error] Couldn't load the ROM to the memory (OOM)");
    free(file_path);
    return -1;
  }
  if (fread(&chip->memory[0x200], sizeof(chip->memory[0]), file_size, file_ptr) != file_size){
    printf("[Error] Couldn't load the ROM to the memory\n");
    free(file_path);
    return -1;
  };

  fclose(file_ptr);

  free(file_path);
  return file_size;
}

int get_random_number() {
  return rand() % 256;
};


EMSCRIPTEN_KEEPALIVE
void chip8_init(Chip8 *chip) {
  memset(chip, 0, sizeof(Chip8));
  chip->pc = 0x200;
  chip->opcode = 0;
  chip->I = 0;
  chip->sp = 0;
  chip->render_flag = 0;
  chip->running = 0;
  memcpy(&chip->memory[0x050], fontset, sizeof(fontset));
  printf("[+] Fontset loaded to memory\n");  
}

unsigned short get_opcode(Chip8 *chip) {
  unsigned short opcode = (chip->memory[chip->pc] << 8) | chip->memory[chip->pc+1]; // opcode sa z 2 bajtow, a tablica jest 1 bajtowa. Dlatego pobieram
  // opcode to 16bitow (czyli unsigned short). Bity 15-12 -> ROzkaz 11-8 Parametr 1 7-4 Parametr 2 

  chip->pc += 2;


  return opcode;
}

void sleep_ms(int milliseconds) {
    struct timespec ts;
    ts.tv_sec = milliseconds / 1000;
    ts.tv_nsec = (milliseconds % 1000) * 1000000;
    nanosleep(&ts, NULL);
}


void gotoxy(int x,int y)    
{
  printf("%c[%d;%df",0x1B,y,x);
} // https://stackoverflow.com/questions/54250401/how-to-control-a-cursor-position-in-c-console-application

void display_screen(char* screen) {
  gotoxy(1, 1);

  for (int y = 0; y < 32; y++){
    for (int x = 0; x < 64; x ++) {
      if (screen[x + y * 64] == 1)
        printf("#");
      else
        printf(" ");
    }
    printf("\n");
  }


}


void run_opcode(Chip8* chip) {
  unsigned short opcode = get_opcode(chip);
  EM_ASM({
        self.executedOpcode($0, $1, $2, $3, $4);
  }, opcode, chip->pc, chip->delay_timer, chip->sound_timer, chip->I);
  unsigned short T = opcode >> 12;
  unsigned short X = (opcode & 0x0F00) >> 8; // usuwa wszyskto poza 2 segment z ciagu 4 znakow. Jest TXYN i bierze tylko 2 - 0X00, potem jest przesuniete o 8 bitow wiec zostaje 0X czyli to co chce
  unsigned short Y = (opcode & 0x00F0) >> 4;
  unsigned short N = (opcode & 0x0000F);
  unsigned short NN = (opcode & 0x00FF);
  unsigned short NNN = (opcode & 0x0FFF);

  switch (T){
    case 0x0:
      if (NN == 0xE0) { // CLS
        system("cls");
        memset(chip->gfx, 0, sizeof(chip->gfx));
        chip->render_flag = 1;
      }else if (NN == 0xEE) { // RET
        chip->sp -= 1;
        chip->pc = chip->stack[chip->sp];
      }
      break;
    case 0x1:
      chip->pc = NNN;
      break;
    case 0x2:
      chip->stack[chip->sp] = chip->pc;
      chip->sp++;

      chip->pc = NNN;
      break;
    case 0x3:
      if (chip->V[X] == NN) {
        chip->pc += 2;
      }
      break;
    case 0x4:
      if (chip->V[X] != NN) {
        chip->pc += 2;
      }
      break;
    case 0x5: 
      if (chip->V[X] == chip->V[Y]){
        chip->pc += 2;
      }
      break;
    case 0x6:
      chip->V[X] = NN;
      break;
    case 0x7:
      chip->V[X] = chip->V[X] + NN;
      break;
    case 0x8:
      if (N == 0x0) {
        chip->V[X] = chip->V[Y];
      }
      else if (N == 0x1) {
        chip->V[X] = chip->V[X] | chip->V[Y];
      }
      else if (N == 0x2) {
        chip->V[X] = chip->V[X] & chip->V[Y];
      }
      else if (N == 0x3) {
        chip->V[X] = chip->V[X] ^ chip->V[Y];
      }
      else if (N == 0x4) {
        int sum = chip->V[X] + chip->V[Y];
        if (sum > 255) {
          chip->V[0xF] = 1;
        }else{
          chip->V[0xF] = 0;
        }
        chip->V[X] = (sum & 0xFF); // ucinam wszystkie bity po 8, nie chce overflowa 
      }
      else if (N == 0x5) {
        chip->V[0xF] = (chip->V[X] >= chip->V[Y]) ? 1 : 0;
        chip->V[X] = chip->V[X] - chip->V[Y];
      }
      else if (N == 0x6) {
        chip->V[0xF] = (chip->V[X] & 1);
        chip->V[X] = chip->V[X] >> 1; // to samo co dzielenie przez 2 as far as i know
      }
      else if (N == 0x7) {
        chip->V[0xF] = (chip->V[Y] > chip->V[X]) ? 1 : 0;
        chip->V[X] = chip->V[Y] - chip->V[X];
      }
      else if (N == 0xE) {
        chip->V[0xF] = (chip->V[X]  >> 7) ? 1 : 0;
        chip->V[X] <<= 1;
      }
     
      break;
    case 0x9:
      if (chip->V[X] != chip->V[Y]){
        chip->pc += 2;
      }
      break;

    case 0xA:
      chip->I = NNN;
      break;
    case 0xB:
      chip->pc = NNN + chip->V[0];
      break;
    case 0xC:
      chip->V[X] = get_random_number() & NN;
      break;
    case 0xD : {
      uint8_t sprite_data[15]; 
      uint8_t x_position = chip->V[X] % 64;
      uint8_t y_position = chip->V[Y] % 32;
      chip->V[0xF] = 0;
      for (int y = 0; y < N; y++) { // kopiowanie N bajtow do sprite_data
          sprite_data[y] = chip->memory[chip->I + y]; // I = adres sprite'a
          for (int bit = 0; bit < 8; bit++) {
            if ((sprite_data[y] & (128 >> bit)) > 0) { // 128 = 10000000 czyli tworze maskę ośmiobitową której wartości przesuwam o bit ktory chce uzyskac, dzieki temu z operacji AND wiem czy bit ktory mnie obchodzi jest wlaczony
                int x = (x_position + bit) % 64;
                int y_coord = (y_position + y) % 32;
                int index = x + y_coord * 64;
                if (chip->gfx[index] == 1)
                {
                  chip->V[0xF] = 1;
                }
                chip->gfx[index] ^= 1;
            }
          }
      }
      chip->render_flag = 1;
      break;
    }
    case 0xE:
      switch (NN) {
        case 0x9E:
          if (chip->key[chip->V[X]]) {
            chip->pc+=2;
          }
          break;
        case 0xA1:
          if (!chip->key[chip->V[X]]) {
            chip->pc+=2;
          }
          break;
      };
      break;
    case 0xF:
      switch (NN){
        case 0x07:
          chip->V[X] = chip->delay_timer;
          break;
        case 0x0A:
          int key_pressed = -1;
          for (int i = 0; i < 16; i++) {
            if (chip->key[i]) {
              key_pressed = i;
              break;
            }
          }

          if (key_pressed != -1) {
            chip->V[X] = key_pressed;
            printf("%d", key_pressed);
          }else{
            chip->pc -= 2;
          }
          break;
        case 0x15:
          chip->delay_timer = chip->V[X];
          break;
        case 0x18:
          chip->sound_timer = chip->V[X];
          break;
        case 0x1E:
          chip->I = chip-> I + chip->V[X];
          break;
        case 0x29:
          chip->I = chip->V[X] * 5 + 0x50; // 0x50 -> adres czcionki w ramie
          break;
        case 0x33:
          int number = chip->V[X];
          int hundreds = number / 100;
          int tens = (number / 10) % 10;
          int ones = number % 10;
          chip->memory[chip->I] = hundreds;
          chip->memory[chip->I + 1] = tens;
          chip->memory[chip->I + 2] = ones;
          break;
        case 0x55:
          for (int i = 0; i <= X; i ++) {
            chip->memory[chip->I + i] = chip->V[i];
          }
          break;
        case 0x65:
          for (int i = 0; i <= X; i ++) {
            chip->V[i] = chip->memory[chip->I + i];
          }
          
          break;
      }
      break;
    default:
      printf("I DONT HAVE IT 0x%X 0x%X\n", opcode, X);
      
  }
}
EMSCRIPTEN_KEEPALIVE
void set_register(int v, unsigned char value) {
  if (chip.V[v]) {
    chip.V[v] = value;
  }
}
EMSCRIPTEN_KEEPALIVE
unsigned char* get_registers_ptr() {
  return &chip.V[0];
}


EMSCRIPTEN_KEEPALIVE
void set_key(int key, unsigned short value) {
  chip.key[key] = value;
}

EMSCRIPTEN_KEEPALIVE
Chip8* get_chip_ptr() {
    return &chip;
}
void chip8_tick() {
    for (int i = 0; i < 12; i ++) { // 720 opcode`ow / sekunde
      run_opcode(&chip);
    }
    if (chip.delay_timer > 0) chip.delay_timer--;
    if (chip.sound_timer > 0) chip.sound_timer--;

}

EMSCRIPTEN_KEEPALIVE
int start_chip8(Chip8 *chip, int rom_size) {
  printf("Start\n");
  int timer_divider = 0;
  chip->running = 1;
  return 0;

};

int main() {
  srand(time(NULL));
  char rom_name[] = "Pong.ch8";
  chip8_init(&chip);
  int rom_size = load_rom(&chip, rom_name);
  if (rom_size <= 0) {
    printf("[-] Failed to load the ROM\n");
    return -1;
  }else{
    printf("[+] ROM loaded to the memory\n");

  };

  return 0;
}