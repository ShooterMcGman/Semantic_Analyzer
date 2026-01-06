export const Logger = {
    log: (label: string, msg: string) => {
        const time = new Date().toISOString().split('T')[1].slice(0, -1); // HH:MM:SS.mmm
        console.log(`%c[${time}] %c[${label}] %c${msg}`, "color: gray", "color: cyan; font-weight: bold", "color: white");
    },
    time: (label: string) => {
        const start = performance.now();
        Logger.log(label, "START");
        return () => {
            const end = performance.now();
            Logger.log(label, `DONE in ${(end - start).toFixed(2)}ms`);
        };
    }
};
