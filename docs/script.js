document.addEventListener('DOMContentLoaded', () => {
    // --- ESTRUCTURA DE ARCHIVOS ---
    // Esto simula una lista de archivos. En un escenario real,
    // esto podría ser generado por un script.
    // Las rutas son relativas a la raíz del repositorio.
    const fileStructure = {
    "application": {
        "type": "folder",
        "children": {
            "assets": {
                "type": "folder",
                "children": {
                    "app.ico": {
                        "type": "default"
                    },
                    "app.png": {
                        "type": "image"
                    },
                    "apps": {
                        "type": "folder",
                        "children": {
                            "FNAF1.png": {
                                "type": "image"
                            },
                            "FNAF2.png": {
                                "type": "image"
                            },
                            "FNAF3.png": {
                                "type": "image"
                            },
                            "FNAF4.png": {
                                "type": "image"
                            },
                            "REPO.png": {
                                "type": "image"
                            },
                            "ScamLine.png": {
                                "type": "image"
                            },
                            "ambidextro.png": {
                                "type": "image"
                            },
                            "backseat-drivers.png": {
                                "type": "image"
                            },
                            "buckshot_roulette.png": {
                                "type": "image"
                            },
                            "content-warning.png": {
                                "type": "image"
                            },
                            "doom.png": {
                                "type": "image"
                            },
                            "hollow-knight-silksong.png": {
                                "type": "image"
                            },
                            "karts-multiplayer.png": {
                                "type": "image"
                            },
                            "lethal-company.png": {
                                "type": "image"
                            },
                            "mage-arena.png": {
                                "type": "image"
                            },
                            "modpack-installer.png": {
                                "type": "image"
                            },
                            "multiai.png": {
                                "type": "image"
                            },
                            "pairdrop.png": {
                                "type": "image"
                            },
                            "stormlauncher.png": {
                                "type": "image"
                            },
                            "stormlibraryv2.png": {
                                "type": "image"
                            },
                            "stormpanel-app.png": {
                                "type": "image"
                            },
                            "stormstore.png": {
                                "type": "image"
                            },
                            "the-shooter.png": {
                                "type": "image"
                            }
                        }
                    },
                    "apps-new-quality": {
                        "type": "folder",
                        "children": {
                            "FNAF2.png": {
                                "type": "image"
                            },
                            "FNAF3.png": {
                                "type": "image"
                            },
                            "REPO.png": {
                                "type": "image"
                            },
                            "ScamLine.png": {
                                "type": "image"
                            },
                            "backseat-drivers.png": {
                                "type": "image"
                            },
                            "buckshot_roulette.png": {
                                "type": "image"
                            },
                            "content-warning.png": {
                                "type": "image"
                            },
                            "karts-multiplayer.png": {
                                "type": "image"
                            },
                            "lethal-company.png": {
                                "type": "image"
                            },
                            "mage-arena.png": {
                                "type": "image"
                            },
                            "pairdrop.png": {
                                "type": "image"
                            },
                            "stormlauncher.png": {
                                "type": "image"
                            },
                            "stormstore.png": {
                                "type": "image"
                            }
                        }
                    },
                    "apps-original": {
                        "type": "folder",
                        "children": {
                            "REPO.png": {
                                "type": "image"
                            },
                            "pairdrop.png": {
                                "type": "image"
                            },
                            "stormlauncher.png": {
                                "type": "image"
                            }
                        }
                    },
                    "extraFiles": {
                        "type": "folder",
                        "children": {
                            "aspnetcore-runtime-8.0.23-win-x64.exe": {
                                "type": "default"
                            }
                        }
                    },
                    "fonts": {
                        "type": "folder",
                        "children": {
                            "Quantico": {
                                "type": "folder",
                                "children": {
                                    "OFL.txt": {
                                        "type": "default"
                                    },
                                    "Quantico-Bold.ttf": {
                                        "type": "font"
                                    },
                                    "Quantico-BoldItalic.ttf": {
                                        "type": "font"
                                    },
                                    "Quantico-Italic.ttf": {
                                        "type": "font"
                                    },
                                    "Quantico-Regular.ttf": {
                                        "type": "font"
                                    },
                                    "zip": {
                                        "type": "folder",
                                        "children": {
                                            "Quantico.zip": {
                                                "type": "default"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "gamepad": {
                        "type": "folder",
                        "children": {
                            "playstation": {
                                "type": "folder",
                                "children": {
                                    "PlayStation_4_Options_button.svg": {
                                        "type": "image"
                                    },
                                    "PlayStation_4_Share_button.svg": {
                                        "type": "image"
                                    },
                                    "PlayStation_Directional_button.svg": {
                                        "type": "image"
                                    },
                                    "PlayStation_Portable_button_Down.svg": {
                                        "type": "image"
                                    },
                                    "PlayStation_Portable_button_Left.svg": {
                                        "type": "image"
                                    },
                                    "PlayStation_Portable_button_Right.svg": {
                                        "type": "image"
                                    },
                                    "PlayStation_Portable_button_Up.svg": {
                                        "type": "image"
                                    },
                                    "PlayStation_button_C.svg": {
                                        "type": "image"
                                    },
                                    "PlayStation_button_Home.svg": {
                                        "type": "image"
                                    },
                                    "PlayStation_button_S.svg": {
                                        "type": "image"
                                    },
                                    "PlayStation_button_T.svg": {
                                        "type": "image"
                                    },
                                    "PlayStation_button_X.svg": {
                                        "type": "image"
                                    },
                                    "PlayStation_button_analog_L.svg": {
                                        "type": "image"
                                    }
                                }
                            },
                            "xbox": {
                                "type": "folder",
                                "children": {
                                    "XboxA.svg": {
                                        "type": "image"
                                    },
                                    "XboxB.svg": {
                                        "type": "image"
                                    },
                                    "XboxX.svg": {
                                        "type": "image"
                                    },
                                    "XboxY.svg": {
                                        "type": "image"
                                    },
                                    "Xbox_Left_stick.svg": {
                                        "type": "image"
                                    },
                                    "Xbox_Logo.svg": {
                                        "type": "image"
                                    },
                                    "Xbox_Menu_button.svg": {
                                        "type": "image"
                                    },
                                    "Xbox_Portable_button_Down.svg": {
                                        "type": "image"
                                    },
                                    "Xbox_Portable_button_Left.svg": {
                                        "type": "image"
                                    },
                                    "Xbox_Portable_button_Right.svg": {
                                        "type": "image"
                                    },
                                    "Xbox_Portable_button_Up.svg": {
                                        "type": "image"
                                    },
                                    "Xbox_Share_button.svg": {
                                        "type": "image"
                                    }
                                }
                            }
                        }
                    },
                    "icons": {
                        "type": "folder",
                        "children": {
                            "big-picture.svg": {
                                "type": "image"
                            },
                            "close-window.svg": {
                                "type": "image"
                            },
                            "controller.svg": {
                                "type": "image"
                            },
                            "curseforge.svg": {
                                "type": "image"
                            },
                            "epic-games.svg": {
                                "type": "image"
                            },
                            "github.svg": {
                                "type": "image"
                            },
                            "info.svg": {
                                "type": "image"
                            },
                            "license.svg": {
                                "type": "image"
                            },
                            "loading-new.svg": {
                                "type": "image"
                            },
                            "loading.svg": {
                                "type": "image"
                            },
                            "maximize-window.svg": {
                                "type": "image"
                            },
                            "minimize-window.svg": {
                                "type": "image"
                            },
                            "share.svg": {
                                "type": "image"
                            },
                            "sin-wifi.svg": {
                                "type": "image"
                            },
                            "steam.svg": {
                                "type": "image"
                            },
                            "stormvortex.svg": {
                                "type": "image"
                            },
                            "update-old.svg": {
                                "type": "image"
                            },
                            "update.svg": {
                                "type": "image"
                            },
                            "web.svg": {
                                "type": "image"
                            },
                            "wifi.svg": {
                                "type": "image"
                            },
                            "windowed-window.svg": {
                                "type": "image"
                            }
                        }
                    },
                    "icons-old": {
                        "type": "folder",
                        "children": {
                            "epic-games.svg": {
                                "type": "image"
                            },
                            "steam.svg": {
                                "type": "image"
                            }
                        }
                    },
                    "media": {
                        "type": "folder",
                        "children": {
                            "sounds": {
                                "type": "folder",
                                "children": {
                                    "finish.mp3": {
                                        "type": "audio"
                                    },
                                    "others.mp3": {
                                        "type": "audio"
                                    }
                                }
                            },
                            "trailers": {
                                "type": "folder",
                                "children": {
                                    "ambidextro.mp4": {
                                        "type": "video"
                                    },
                                    "backseat-drivers.mp4": {
                                        "type": "video"
                                    },
                                    "buckshot_roulette.mp4": {
                                        "type": "video"
                                    },
                                    "content-warning.mp4": {
                                        "type": "video"
                                    },
                                    "doom.mp4": {
                                        "type": "video"
                                    },
                                    "fnaf1.mp4": {
                                        "type": "video"
                                    },
                                    "fnaf2.mp4": {
                                        "type": "video"
                                    },
                                    "fnaf3.mp4": {
                                        "type": "video"
                                    },
                                    "fnaf4.mp4": {
                                        "type": "video"
                                    },
                                    "hollow-knight-silksong.mp4": {
                                        "type": "video"
                                    },
                                    "lethal-company.mp4": {
                                        "type": "video"
                                    },
                                    "mage-arena.mp4": {
                                        "type": "video"
                                    },
                                    "repo.mp4": {
                                        "type": "video"
                                    },
                                    "scamline.mp4": {
                                        "type": "video"
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    "debs": {
        "type": "folder",
        "children": {
            "CardinalAI-1.0.3-amd64.deb": {
                "type": "deb"
            },
            "cardinal-ai-dualmodel-app.deb": {
                "type": "deb"
            },
            "data-exporter.deb": {
                "type": "deb"
            },
            "kartsmultiplayerlauncher_deb.deb": {
                "type": "deb"
            },
            "multiai_1.2.10_amd64.deb": {
                "type": "deb"
            },
            "pairdrop.deb": {
                "type": "deb"
            },
            "theshooterlauncher_deb.deb": {
                "type": "deb"
            },
            "whatsapp-web.deb": {
                "type": "deb"
            }
        }
    }
};

    const fileTreeContainer = document.getElementById('file-tree');
    const mediaViewer = document.getElementById('media-viewer');
    const viewerImage = document.getElementById('viewer-image');
    const viewerVideo = document.getElementById('viewer-video');
    const viewerAudio = document.getElementById('viewer-audio');
    const viewerInfo = document.getElementById('viewer-info');
    const downloadLink = document.getElementById('download-link');
    const closeViewerBtn = document.querySelector('.close-viewer');

    // Función para obtener el icono basado en el tipo de archivo
    function getIconClass(type) {
        switch (type) {
            case 'folder': return 'icon-folder';
            case 'image': return 'icon-image';
            case 'video': return 'icon-video';
            case 'audio': return 'icon-audio';
            case 'font': return 'icon-font';
            case 'deb': return 'icon-deb';
            default: return 'icon-default';
        }
    }

    // Función recursiva para construir el árbol HTML
    function buildTree(data, path = '') {
        const ul = document.createElement('ul');
        for (const name in data) {
            const item = data[name];
            const currentPath = path ? `${path}/${name}` : name;
            const li = document.createElement('li');

            const isFolder = item.type === 'folder';
            li.className = isFolder ? 'folder' : 'file';

            let nodeHtml = `
                <div class="tree-node">
                    <span class="node-info">
                        <span class="icon ${getIconClass(item.type)}"></span>
                        ${name}
                    </span>
                    <div class="node-actions">
                        <button class="action-btn copy-link-btn" data-path="${currentPath}">Copiar Enlace</button>
                        <a href="../${currentPath}" target="_blank" class="action-btn">Ver Crudo</a>
                        ${!isFolder ? `<button class="action-btn view-btn" data-path="${currentPath}" data-type="${item.type}">Previsualizar</button>` : ''}
                    </div>
                </div>
            `;
            li.innerHTML = nodeHtml;
            
            if (isFolder) {
                const subTree = buildTree(item.children, currentPath);
                li.appendChild(subTree);
                li.querySelector('.node-info').addEventListener('click', () => {
                    li.classList.toggle('expanded');
                });
            }
            
            ul.appendChild(li);
        }
        return ul;
    }

    // Función para abrir el visualizador
    function openViewer(path, type) {
        // Ocultar todos los elementos del visor primero
        viewerImage.style.display = 'none';
        viewerVideo.style.display = 'none';
        viewerAudio.style.display = 'none';
        viewerInfo.style.display = 'none';

        const fullUrl = `../${path}`;

        if (type === 'image') {
            viewerImage.src = fullUrl;
            viewerImage.style.display = 'block';
        } else if (type === 'video') {
            viewerVideo.src = fullUrl;
            viewerVideo.style.display = 'block';
            viewerVideo.play();
        } else if (type === 'audio') {
            viewerAudio.src = fullUrl;
            viewerAudio.style.display = 'block';
            viewerAudio.play();
        } else {
            downloadLink.href = fullUrl;
            viewerInfo.style.display = 'block';
        }
        mediaViewer.style.display = 'flex';
    }

    // Función para cerrar el visualizador
    function closeViewer() {
        mediaViewer.style.display = 'none';
        viewerImage.src = '';
        viewerVideo.src = '';
        viewerAudio.src = '';
        viewerVideo.pause();
        viewerAudio.pause();
    }

    // Generar y mostrar el árbol
    fileTreeContainer.appendChild(buildTree(fileStructure));

    // Delegación de eventos para los botones de acción
    fileTreeContainer.addEventListener('click', (e) => {
        const target = e.target;
        
        // Botón de previsualizar
        if (target.classList.contains('view-btn')) {
            const path = target.dataset.path;
            const type = target.dataset.type;
            openViewer(path, type);
        }

        // Botón de copiar enlace
        if (target.classList.contains('copy-link-btn')) {
            const path = target.dataset.path;
            const pageUrl = window.location.href.split('/docs/')[0];
            const fileUrl = `${pageUrl}/${path}`;
            
            navigator.clipboard.writeText(fileUrl).then(() => {
                const originalText = target.textContent;
                target.textContent = '¡Copiado!';
                setTimeout(() => {
                    target.textContent = originalText;
                }, 1500);
            }).catch(err => {
                console.error('Error al copiar el enlace: ', err);
            });
        }
    });

    // Eventos para cerrar el visualizador
    closeViewerBtn.addEventListener('click', closeViewer);
    mediaViewer.addEventListener('click', (e) => {
        if (e.target === mediaViewer) { // Cerrar solo si se hace clic en el fondo
            closeViewer();
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeViewer();
        }
    });
});