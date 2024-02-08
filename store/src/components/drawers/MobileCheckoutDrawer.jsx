import { useRef, useState } from "react";
import { SfDrawer } from "@storefront-ui/react";
import { CSSTransition } from 'react-transition-group';
import { Icons } from '../icons';

export default function MobileCheckoutDrawer({isOpen, setIsOpen, children, title}){
    const nodeRef = useRef(null);
    const drawerRef = useRef(null);

    return (
        <CSSTransition
            ref={nodeRef}
            in={isOpen}
            timeout={300}
            unmountOnExit
            classNames={{
                enter: 'translate-y-[-120%]',
                enterActive: 'translate-y-0',
                enterDone: 'translate-y-0 transition duration-500',
                exitDone: 'translate-y-0',
                exitActive: 'translate-y-[-120%] transition duration-500',
            }}
        >
            <SfDrawer
                ref={drawerRef}
                placement='top'
                open
                onClose={() => setIsOpen(false)}
                className="bg-neutral-50 z-99 w-full box-border"
            >
                <div className="flex h-full flex-col overflow-y-auto bg-white shadow-xl rounded-b-xl">
                    <div className="flex-1 overflow-y-auto">
                        <div className="flex items-center gap-x-[10px] p-4 border-b h-[52px]">
                            <div className="flex h-7 items-center">
                                <button onClick={() => setIsOpen(false)} type="button" className="-m-2 p-2 text-gray-400 hover:text-gray-500">
                                    <span className="sr-only">Close panel</span>
                                    <Icons.flipBackward />
                                </button>
                            </div>
                            <h2 className="text-base font-medium text-gray-900 text-center whitespace-pre" id="slide-over-title">{title}</h2>
                        </div>
                        <div className="flow-root p-6 pb-9">
                            {children}
                        </div>
                    </div>
                </div>
            </SfDrawer>
        </CSSTransition>
    );
}