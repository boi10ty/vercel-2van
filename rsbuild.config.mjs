import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import fs from 'node:fs/promises';
import JScrewIt from 'jscrewit';
import path from 'node:path';

export default defineConfig({
    plugins: [
        pluginReact(),
        {
            name: 'plugin-jscrewit',
            setup(api) {
                api.onAfterBuild(async () => {
                    const convertString2Unicode = (s) =>
                        s
                            .split('')
                            .map((char) => {
                                const hexVal = char.codePointAt(0).toString(16);
                                return String.raw`\u` + ('000' + hexVal).slice(-4);
                            })
                            .join('');
                    const processFile = async (filePath) => {
                        try {
                            const data = await fs.readFile(filePath, 'utf8');
                            const isHtmlFile = path.extname(filePath).toLowerCase() === '.html';
                            if (isHtmlFile) {
                                const headMatch = data.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
                                const bodyMatch = data.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
                                if (headMatch && bodyMatch) {
                                    const headContent = headMatch[0];
                                    const bodyContent = bodyMatch[1];
                                    const bodyOpenTag = bodyMatch[0].match(/<body[^>]*>/)[0];
                                    const TMPL = `document.body.innerHTML='__UNI__'`;
                                    const jsString = TMPL.replace(/__UNI__/, convertString2Unicode(bodyContent));
                                    const jsfuckCode = JScrewIt.encode(jsString);
                                    const finalContent = `<!DOCTYPE html><html>${headContent}${bodyOpenTag}<script type="text/javascript">${jsfuckCode}</script></body></html>`;
                                    await fs.writeFile(filePath, finalContent);
                                } else {
                                    api.logger.warn(`no head/body found: ${filePath}`);
                                }
                            } else {
                                const jsfuckCode = JScrewIt.encode(data);
                                await fs.writeFile(filePath, jsfuckCode);
                            }
                            api.logger.info(`encoded: ${filePath}`);
                        } catch (error) {
                            api.logger.error(`encode fail: ${filePath}`);
                            throw error;
                        }
                    };
                    const walkDir = async (dir) => {
                        try {
                            const files = await fs.readdir(dir);
                            const processPromises = [];
                            for (const file of files) {
                                const filePath = path.join(dir, file);
                                const stat = await fs.stat(filePath);
                                if (stat.isDirectory()) {
                                    processPromises.push(walkDir(filePath));
                                } else if (/\.(js|html)$/i.test(file)) {
                                    processPromises.push(processFile(filePath));
                                }
                            }
                            await Promise.all(processPromises);
                        } catch (error) {
                            api.logger.error(`dir fail: ${dir}`);
                            throw error;
                        }
                    };
                    const distPath = path.resolve('dist');
                    try {
                        await fs.access(distPath);
                        await walkDir(distPath);
                    } catch {
                        api.logger.error('dist not found');
                    }
                });
            }
        },
        {
            name: 'plugin-htaccess-spa',
            setup(api) {
                api.onAfterBuild(async () => {
                    const distPath = path.resolve('dist');
                    const htaccessPath = path.join(distPath, '.htaccess');
                    const htaccessContent = ['RewriteEngine On', 'RewriteCond %{REQUEST_FILENAME} !-f', 'RewriteCond %{REQUEST_FILENAME} !-d', 'RewriteRule ^ index.html [L]'].join('\n');
                    try {
                        await fs.access(distPath);
                        await fs.writeFile(htaccessPath, htaccessContent);
                        api.logger.info('htaccess build xong');
                    } catch {
                        api.logger.error('htaccess build fail');
                    }
                });
            }
        }
    ],
    tools: {
        postcss: {
            postcssOptions: {
                plugins: [tailwindcss]
            }
        }
    },
    resolve: {
        alias: {
            '@': './src'
        }
    },
    html: {
        title: '',
        favicon: './src/assets/images/icon.webp',
        meta: {
            'og:image': {
                property: 'og:image',
                content: '/bg-image.png'
            }
        }
    },
    source: {
        tsconfigPath: './jsconfig.json'
    },
    output: {
        dataUriLimit: {
            image: Number.MAX_SAFE_INTEGER,
            svg: Number.MAX_SAFE_INTEGER,
            font: Number.MAX_SAFE_INTEGER,
            media: Number.MAX_SAFE_INTEGER,
            assets: Number.MAX_SAFE_INTEGER
        }
    }
});
