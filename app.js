let submitIcon = `
   <button class="submit-btn" type="button">
      <span class="loading-text">Loading...</span>
      <span class="default-text">Submit</span>
   </button>
`;

function getURLParameter(e) {
  return (
    decodeURIComponent(
      (new RegExp('[?|&]' + e + '=([^&;]+?)(&|#|;|$)').exec(
        location.search
      ) || [null, ''])[1].replace(/\+/g, '%20')
    ) || null
  );
}
const spinner = document.getElementById('spinner');
let isAddingNewNode = false;

var treeId = getURLParameter('treeId');
var user_id = getURLParameter('user_id');
var apiRetrievedData = [];
var aData = [];
var Freeze = true;

// add nodes icon
const nodeMenuTreeStyle = document.createElement('style');
nodeMenuTreeStyle.innerHTML = `
    use[data-ctrl-n-t-menu-id] {
        display: none;
    }

    use[data-ctrl-n-t-menu-id="${user_id}"] {
        display: block;
    }
`;
document.head.appendChild(nodeMenuTreeStyle);

// add relative icon
const nodeMenuStyle = document.createElement('style');
nodeMenuStyle.innerHTML = `
    use[data-ctrl-n-menu-id] {
        display: none;
    }
    use[data-ctrl-n-menu-id^="${user_id}"] {
        display: block;
    }
`;
document.head.appendChild(nodeMenuStyle);

document.addEventListener('click', () => {
  const spouseSelect = document.querySelector("[data-binding='Spouse']");
  const relativeType = document.querySelector("[data-binding='Relative Type']");
  const spouseLabel = spouseSelect ? spouseSelect.previousElementSibling : null;

  if (relativeType && relativeType.value === 'children') {
    if (spouseSelect) spouseSelect.style.display = 'block';
    if (spouseLabel) spouseLabel.style.display = 'block';
  } else {
    if (spouseSelect) spouseSelect.style.display = 'none';
    if (spouseLabel) spouseLabel.style.display = 'none';
  }
});

async function start() {
  spinner.removeAttribute('hidden');
  try {
    const response = await fetch(
      'https://apinew.bridjus.com/tree/get-tree?tree_id=' + treeId,
      {
        method: 'GET',
      }
    );

    if (response.ok) {
      const result = await response.json();
      // console.log(result.data.final_filter, 'response.data');
      const filteredData = result.data.final_filter.filter((item) => item.pids);
      console.log(filteredData, 'filteredData');
      const currentUser = filteredData.find((person) => person.id === user_id);
      let options = [];

      if (currentUser) {
        console.log('currentUser=>', currentUser.pids);
        const spouses = filteredData.filter((item) => {
          return item.pids && item.pids.includes(currentUser.id);
        });

        console.log(spouses, 'spouses');
        spouses.forEach((spouse) => {
          options.push({
            value: spouse.id,
            text: spouse.name,
          });
        });
      }
      console.log(options, 'options');
      var chart = new FamilyTree(document.getElementById('tree'), {
        mouseScrool: FamilyTree.action.zoom,
        lazyLoading: true,
        // enableTouch: true,
        nodeMouseClick: FamilyTree.action.edit,
        scaleInitial: 0.4,
        // toolbar: {
        //   layout: true,
        //   zoom: true,
        //   fit: true,
        //   expandAll: false,
        //   fullScreen: true,
        // },
        mode: 'light',
        enableSearch: false,
        template: 'hugo',
        nodeMenu: {
          edit: {
            icon: `<i class="fas fa-share"></i>`,
            text: 'Add Relative',
          },
        },
        nodeBinding: {
          field_0: 'name',
          field_1: 'gender',
          img_0: 'img',
        },
        editForm: {
          titleBinding: 'name',
          photoBinding: 'photo',
          addMoreBtn: 'Add element',
          addMore: 'Add more elements',
          addMoreFieldName: 'Element name',
          generateElementsFromFields: false,
          addMore: false,
          buttons: {
            pdf: null,
            share: null,
            remove: null,
            submit: {
              text: 'submit',
              icon: submitIcon,
            },
            close: {
              icon: '<i class="fas fa-times"></i>',
              text: '',
            },
          },
          addMore: '',
          addMoreBtn: '',
          addMoreFieldName: '',
          cancelBtn: '',
          saveAndCloseBtn: '',
          elements: [
            {
              type: 'select',
              label: 'Choose Relative Type',
              binding: 'Relative Type',
              options: [
                {
                  value: '',
                  text: '',
                },
                {
                  value: 'parent',
                  text: 'Parent',
                },
                {
                  value: 'children',
                  text: 'Children',
                },
                {
                  value: 'spouse',
                  text: 'Spouse',
                },
              ],
            },
            {
              type: 'select',
              options: options,
              label: 'Select spouse',
              binding: 'Spouse',
            },

            {
              type: 'textbox',
              label: 'Relative Email',
              binding: 'relative_email',
              vlidators: { required: 'Is required', email: 'Invalid email' },
            },
          ],
        },
      });

      chart.on('click', function (sender, args) {
        args.preventDefault();
      });

      let isEditUIButtonClickEventAdded = false;
      chart.nodeMenuUI.on('show', async function (sender, args) {
        console.log(args, 'nodeMenuUI triggered');

        if (!isEditUIButtonClickEventAdded) {
          isEditUIButtonClickEventAdded = true;
          chart.editUI.on('button-click', async function (sender, args) {
            console.log(args, 'args in editUI');
            chart.removeNode(args.id);

            if (args.name === 'submit') {
              var relativeEmailInputValue = document.querySelector(
                "input[data-binding='relative_email']"
              )?.value;
              const selectedSuposeId = document.querySelector(
                "[data-binding='Spouse']"
              )?.value;
              const relativeType = document.querySelector(
                "[data-binding='Relative Type']"
              )?.value;

              console.log(selectedSuposeId, 'selectedSuposeId');
              console.log(relativeType, 'relativeType');
              console.log(relativeEmailInputValue, 'Typed Relative Email');

              if (!relativeEmailInputValue) {
                return Toastify({
                  text: 'Please fill relative email field',
                  duration: 3000,
                  position: 'center',
                  style: {
                    background: 'linear-gradient(180deg, #dd464c, #8d2729)',
                  },
                }).showToast();
              }
              if (!relativeType) {
                return Toastify({
                  text: 'Please select relative type',
                  duration: 3000,
                  position: 'center',
                  style: {
                    background: 'linear-gradient(180deg, #dd464c, #8d2729)',
                  },
                }).showToast();
              }
              const payload = {
                tree_id: treeId,
                user_id: user_id,
                relative_type: relativeType,
                relative_email: relativeEmailInputValue.toLowerCase(),
                api: 'https://bridjus.page.link?amv=0&apn=com.bridjus.thesuitch&ibi=com.app.bridjus&imv=0&isi=1669724719&link=https%3A%2F%2Fbridjus.page.link',
              };
              if (relativeType === 'children') {
                payload['spouse_id'] = selectedSuposeId || null;
              }
              console.log('payload=>', payload);
              var submitButton = document.querySelector('.submit-btn');
              console.log(submitButton, 'submitButton');
              submitButton.setAttribute('disabled', 'disabled');
              submitButton.classList.add('loading');
              try {
                const response = await fetch(
                  'https://apinew.bridjus.com/tree/add-relative',
                  {
                    method: 'POST',
                    body: JSON.stringify(payload),
                    headers: {
                      'Content-Type': 'application/json',
                    },
                  }
                );
                if (response.ok) {
                  const result = await response.json();
                  console.log(result.data, 'Added relative successfully');
                  Toastify({
                    text: 'Relative Added Successfully',
                    duration: 3000,
                    position: 'center',
                    style: {
                      background: '#4BB543',
                    },
                  }).showToast();
                  var formElement = document.querySelector('.bft-edit-form');
                  if (formElement) {
                    formElement.style.display = 'none';
                  }
                  return;
                  // chart.removeNode(args.nodeId);
                }
                if (response.status === 400) {
                  return Toastify({
                    text: 'Relative Already Exists',
                    duration: 3000,
                    position: 'center',
                    style: {
                      background: 'red',
                    },
                  }).showToast();
                } else {
                  console.error('Error while adding relative:', error);
                  Toastify({
                    text: 'Error while adding relative',
                    duration: 3000,
                    position: 'center',
                    style: {
                      background: 'linear-gradient(180deg, #dd464c, #8d2729)',
                    },
                  }).showToast();
                }
                return result.data;
              } catch (error) {
                console.log('Error while adding relative:', error.message);
                Toastify({
                  text: 'Error while adding relative',
                  duration: 3000,
                  position: 'center',
                  style: {
                    background: 'red',
                  },
                }).showToast();
              } finally {
                console.log('finally');
                submitButton.removeAttribute('disabled');
                submitButton.classList.remove('loading');
              }
            }
          });
        }
      });

      for (i = 0; i < result.data.final_filter.length; i++) {
        apiRetrievedData.push({
          id: result.data.final_filter[i]?.id,
          pids: result.data.final_filter[i]?.pids,
          mid: result.data.final_filter[i]?.mid,
          name: result.data.final_filter[i].name,
          fid: result.data.final_filter[i].fid,
          img: result.data.final_filter[i].photo,
          gender: result.data.final_filter[i].gender.toLowerCase(),
        });
      }
      for (j = 0; j < apiRetrievedData.length; j++) {
        // console.log(apiRetrievedData[j], 'apiRetrievedData[j]');
      }
      chart.load(apiRetrievedData);
      spinner.setAttribute('hidden', '');
    }
  } catch (err) {
    console.log(err.message);
    spinner.setAttribute('hidden', '');
    throw new Error(`Error: ${err.message}`, { cause: err });
  }
}

if (Freeze) {
  start();
  Freeze = false;
}

// Path: family-tree.js

// let submitIcon = `
//    <button class="submit-btn" type="button">
//       <span class="loading-text">Loading...</span>
//       <span class="default-text">Submit</span>
//    </button>
// `;

// function getURLParameter(e) {
//   return (
//     decodeURIComponent(
//       (new RegExp('[?|&]' + e + '=([^&;]+?)(&|#|;|$)').exec(
//         location.search
//       ) || [null, ''])[1].replace(/\+/g, '%20')
//     ) || null
//   );
// }
// const spinner = document.getElementById('spinner');
// let isAddingNewNode = false;

// var treeId = getURLParameter('treeId');
// var user_id = getURLParameter('user_id');
// var apiRetrievedData = [];
// var aData = [];
// var Freeze = true;

// const determineRelativeType = (data) => {
//   console.log(data, 'determineRelativeType');
//   if (data?.pids && !data.fid && !data.mid) {
//     return 'spouse';
//   }
//   if (data?.gender && data?.pids && data.id) {
//     return 'parent';
//   }
//   if (data?.mid && data.fid && data?.gender) {
//     return 'children';
//   }
//   return null;
// };

// const nodeMenuTreeStyle = document.createElement('style');
// nodeMenuTreeStyle.innerHTML = `
//     use[data-ctrl-n-t-menu-id] {
//         display: none;
//     }

//     use[data-ctrl-n-t-menu-id="${user_id}"] {
//         display: inline;
//     }
// `;
// document.head.appendChild(nodeMenuTreeStyle);

// const nodeMenuStyle = document.createElement('style');
// nodeMenuStyle.innerHTML = `
//     use[data-ctrl-n-menu-id] {
//         display: none;
//     }
//     use[data-ctrl-n-menu-id^="_"] {
//         display: inline;
//     }
// `;
// document.head.appendChild(nodeMenuStyle);

// async function start() {
//   spinner.removeAttribute('hidden');
//   try {
//     const response = await fetch(
//       'https://apinew.bridjus.com/tree/get-tree?tree_id=' + treeId,
//       {
//         method: 'GET',
//       }
//     );

//     if (response.ok) {
//       const result = await response.json();
//       // console.log(result.data.final_filter, 'response.data');
//       const filteredData = result.data.final_filter.filter((item) => item.pids);
//       // console.log(filteredData, 'filteredData');
//       const currentUser = filteredData.find((person) => person.id === user_id);
//       // console.log(currentUser, 'currentUser');
//       let options = [];

//       if (currentUser) {
//         const spouse = filteredData.find(
//           (item) => item.pids && item.pids.includes(currentUser.id)
//         );
//         // console.log(spouse, 'spouse.currentUser');
//         if (spouse) {
//           // console.log(spouse, "spouse['id']");
//           options.push({
//             value: spouse.id,
//             text: spouse.name,
//           });
//         }
//       }
//       // console.log(options, 'options');
//       var chart = new FamilyTree(document.getElementById('tree'), {
//         showXScroll: FamilyTree.scroll.visible,
//         showYScroll: FamilyTree.scroll.visible,
//         mouseScrool: FamilyTree.action.zoom,
//         nodeMouseClick: FamilyTree.action.details,
//         scaleInitial: 0.8,
//         mode: 'light',
//         enableSearch: false,
//         template: 'hugo',
//         nodeTreeMenu: true,
//         lazyLoading: true,
//         nodeBinding: {
//           field_0: 'name',
//           field_1: 'gender',
//           img_0: 'img',
//         },
//         editForm: {
//           titleBinding: 'name',
//           photoBinding: 'photo',
//           addMoreBtn: 'Add element',
//           addMore: 'Add more elements',
//           addMoreFieldName: 'Element name',
//           generateElementsFromFields: false,
//           addMore: false,
//           buttons: {
//             pdf: null,
//             share: null,
//             remove: null,
//             submit: {
//               text: 'submit',
//               icon: submitIcon,
//             },
//             close: {
//               icon: '<i class="fas fa-times"></i>',
//               text: '',
//             },
//           },
//           addMore: '',
//           addMoreBtn: '',
//           addMoreFieldName: '',
//           cancelBtn: '',
//           saveAndCloseBtn: '',
//           elements: [
//             {
//               type: 'textbox',
//               label: 'Relative Email',
//               binding: 'relative_email',
//               vlidators: { required: 'Is required', email: 'Invalid email' },
//             },
//             {
//               type: 'select',
//               options: options,
//               label: 'Select spouse',
//               binding: 'Spouse',
//             },
//           ],
//         },
//       });
//       chart.on('click', function (sender, args) {
//         console.log(args.node.id, 'Clicked on Node');
//         // args.preventDefault();
//       });

//       let isButtonClickListenerAttached = false;
//       let currentNodeData = null;
//       chart.on('updated', async function (sender, args) {
//         if (args.addNodesData.length) {
//           // console.log(args, 'args in updated');
//           currentNodeData = args.addNodesData[0];
//           console.log(currentNodeData, 'currentNodeData');
//           sender.editUI.show(currentNodeData.id);
//           chart.removeNode(currentNodeData.id);

//           const spouseSelect = document.querySelector(
//             "[data-binding='Spouse']"
//           );
//           const spouseLabel = spouseSelect
//             ? spouseSelect.previousElementSibling
//             : null;
//           if (
//             currentNodeData &&
//             currentNodeData.fid &&
//             currentNodeData.mid &&
//             options.length > 0
//           ) {
//             if (spouseSelect) spouseSelect.style.display = 'block';
//             if (spouseLabel) spouseLabel.style.display = 'block';
//           } else {
//             if (spouseSelect) spouseSelect.style.display = 'none';
//             if (spouseLabel) spouseLabel.style.display = 'none';
//           }
//           // console.log('Before submit block');
//           if (!isButtonClickListenerAttached) {
//             chart.editUI.on('button-click', async function (sender, args) {
//               console.log('ARGS IN EDITUI', args);
//               if (args.name === 'submit') {
//                 chart.removeNode(args.nodeId);
//                 var relativeEmailInputValue = document.querySelector(
//                   "input[data-binding='relative_email']"
//                 )?.value;
//                 const selectedSuposeId = document.querySelector(
//                   "[data-binding='Spouse']"
//                 )?.value;
//                 // console.log(selectedSuposeId, 'selectedSuposeId');
//                 if (!relativeEmailInputValue)
//                   return Toastify({
//                     text: 'Please fill in this field',
//                     duration: 3000,
//                     position: 'center',
//                     style: {
//                       background: 'linear-gradient(180deg, #dd464c, #8d2729)',
//                     },
//                   }).showToast();
//                 console.log(relativeEmailInputValue, 'Typed Relative Email');
//                 const relativeType = determineRelativeType(currentNodeData);
//                 console.log(relativeType, 'relativeType');
//                 const payload = {
//                   tree_id: treeId,
//                   user_id: user_id,
//                   relative_type: relativeType,
//                   relative_email: relativeEmailInputValue.toLowerCase(),
//                   api: 'abc.com',
//                   ...(currentNodeData?.fid && currentNodeData?.mid
//                     ? {
//                         relative_type: 'children',
//                         spouse_id: selectedSuposeId || null,
//                       }
//                     : {}),
//                 };
//                 console.log('payload=>', payload);
//                 var submitButton = document.querySelector('.submit-btn');
//                 submitButton.classList.add('loading');
//                 try {
//                   const response = await fetch(
//                     'https://apinew.bridjus.com/tree/add-relative',
//                     {
//                       method: 'POST',
//                       body: JSON.stringify(payload),
//                       headers: {
//                         'Content-Type': 'application/json',
//                       },
//                     }
//                   );

//                   if (response.ok) {
//                     const result = await response.json();
//                     console.log(result.message);
//                     Toastify({
//                       text: result.message,
//                       duration: 3000,
//                       position: 'center',
//                       style: {
//                         background:
//                           'linear-gradient(to right, #00b09b, #96c93d)',
//                       },
//                     }).showToast();
//                   } else {
//                     console.error('Error while adding relative:', error);
//                     Toastify({
//                       text: error,
//                       duration: 3000,
//                       position: 'center',
//                       style: {
//                         background: 'linear-gradient(180deg, #dd464c, #8d2729)',
//                       },
//                     }).showToast();
//                   }
//                 } catch (error) {
//                   console.error('Error while adding relative:', error);
//                   Toastify({
//                     text: error,
//                     duration: 3000,
//                     position: 'center',
//                     style: {
//                       background: 'red',
//                     },
//                   }).showToast();
//                 } finally {
//                   // console.log('finally');
//                   submitButton.classList.remove('loading');
//                 }
//               }
//             });
//             isButtonClickListenerAttached = true;
//           }
//         }
//       });
//       for (i = 0; i < result.data.final_filter.length; i++) {
//         apiRetrievedData.push({
//           id: result.data.final_filter[i]?.id,
//           pids: result.data.final_filter[i]?.pids,
//           mid: result.data.final_filter[i]?.mid,
//           name: result.data.final_filter[i].name,
//           fid: result.data.final_filter[i].fid,
//           img: result.data.final_filter[i].photo,
//           gender: result.data.final_filter[i].gender.toLowerCase(),
//           // gender: result.data.final_filter[i].gender,
//         });
//       }
//       for (j = 0; j < apiRetrievedData.length; j++) {
//         // console.log(apiRetrievedData[j], 'apiRetrievedData[j]');
//       }
//       chart.load(apiRetrievedData);
//       spinner.setAttribute('hidden', '');
//     }
//   } catch (err) {
//     console.log(err.message);
//     spinner.setAttribute('hidden', '');
//     throw new Error(`Error: ${err.message}`, { cause: err });
//   }
// }

// if (Freeze) {
//   start();
//   Freeze = false;
// }
