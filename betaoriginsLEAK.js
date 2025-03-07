const base = Module.findBaseAddress("libg.so");
const readPtr = Module.findExportByName('libc.so', 'read');

const connect = Interceptor.attach(Module.findExportByName(null, 'getaddrinfo'), {
    onEnter: function(args) {
        this.path = args[0].readUtf8String();
        if (this.path === base.add(0x055AD86).readUtf8String()) {
            this.z = args[0] = Memory.allocUtf8String("127.0.0.1");
        }
    }
});

var buf;
var check = 0;
            
const reader = Interceptor.attach(readPtr, {
    onEnter: function(args) {
        if(args[2] == 32) {
            check = 1;
            buf = args[1];
        }
    },
    onLeave: function(args) {
        if(check == 1) {
            Memory.writeByteArray(buf, [0xBB, 0x14, 0xD6, 0xFD, 0x2B, 0x7C, 0x98, 0x23, 0xEA, 0xED, 0xB4, 0x33, 0x8C, 0xB7, 0x23, 0x7F, 0x61, 0xE4, 0x22, 0xD2, 0x3C, 0x49, 0x77, 0xF7, 0x4A, 0xDA, 0x05, 0x27, 0x02, 0xC0, 0xC6, 0x2D]);
            check = 0;
        }
    }
});

const Libg = {
    init() {
        this.base = Module.findBaseAddress('libg.so');
        this.DebugMenuButton = malloc(1500);
        this.DebugMenu = malloc(2000);
    },
    offset(off) {
        return this.base.add(off);
    }
}

Libg.init();
const DebugMenu = {
    createDebugButton() {
        const StageAdd = new NativeFunction(Libg.offset(0x3BF30), 'void', ['pointer', 'pointer']);
        const fSetText = new NativeFunction(Libg.offset(0x3E1018), 'pointer', ['pointer', 'pointer']);
        const DebugMenuCtor = new NativeFunction(Libg.offset(0x1AC20C), 'pointer', ['pointer']);
        const ResourceManager = new NativeFunction(Libg.offset(0x3685A8), 'pointer', ['pointer', 'pointer', 'bool']);
        
        setTimeout(function() {
            DebugMenuCtor(Libg.DebugMenu);
            let debugMenuButton = ResourceManager(createStringPtr("sc/debug.sc"), createStringPtr("debug_menu_button"), 1);
            fSetText(Libg.DebugMenuButton, createStringObject("D"));
            StageAdd(Libg.offset(0x7D242C).readPointer(), debugMenuButton);
        }, 2000);
    }
}

const AddFiler = {
    init(scfile) {
        const AddFile = new NativeFunction(Libg.offset(0x28E1B0), 'int', ['pointer', 'pointer', 'int', 'int', 'int', 'int']);
        const AddFilik = Interceptor.attach(Libg.offset(0x28E1B0), {
            onEnter(args) {
                AddFile(args[0], createStringPtr(scfile), -1, -1, -1, -1);
                console.warn('[AddFile] sc/debug.sc loaded');
                AddFilik.detach();
            }
        });
    }
}

Interceptor.attach(Module.findExportByName('libc.so', 'getaddrinfo'), {
    onEnter(args) {
        DebugMenu.createDebugButton();
        AddFiler.init("sc/debug.sc");
    }
});
