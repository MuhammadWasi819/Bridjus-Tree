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

let determineRelativeType = (data) => {
  console.log(data, 'determineRelativeType');
  if (data?.gender && !data?.mid && !data?.fid) return 'parent';
  if (data?.pids) return 'spouse';
  if (data?.mid && data.fid && data?.gender) return 'children';
  return 'unknown';
};

const nodeMenuTreeStyle = document.createElement('style');
nodeMenuTreeStyle.innerHTML = `
    use[data-ctrl-n-t-menu-id] {
        display: none;
    }

    use[data-ctrl-n-t-menu-id="${user_id}"] {
        display: inline; 
    }
`;
document.head.appendChild(nodeMenuTreeStyle);

const nodeMenuStyle = document.createElement('style');
nodeMenuStyle.innerHTML = `
    use[data-ctrl-n-menu-id] {
        display: none;
    }
    use[data-ctrl-n-menu-id^="_"] {
        display: inline;
    }
`;
document.head.appendChild(nodeMenuStyle);

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
      console.log(result.data.final_filter, 'response.data');
      const filteredData = result.data.final_filter.filter((item) => item.pids);
      console.log(filteredData, 'filteredData');
      const currentUser = filteredData.find((person) => person.id === user_id);
      console.log(currentUser, 'currentUser');
      let options = [];

      if (currentUser) {
        const spouse = filteredData.find(
          (item) => item.pids && item.pids.includes(currentUser.id)
        );
        console.log(spouse, 'spouse.currentUser');
        if (spouse) {
          console.log(spouse, "spouse['id']");
          options.push({
            value: spouse.id,
            text: spouse.name,
          });
        }
      }
      console.log(options, 'options');
      var chart = new FamilyTree(document.getElementById('tree'), {
        mouseScrool: FamilyTree.none,
        nodeMouseClick: FamilyTree.action.details,
        mode: 'light',
        enableSearch: false,
        template: 'hugo',
        nodeTreeMenu: true,
        // nodeMenu: {
        //   edit: {
        //     text: 'Add Relative',
        //   },
        //   details: {
        //     text: 'Details',
        //     onClick: (node, nodeId) => {
        //       console.log('detail', nodeId, node);
        //     },
        //   },
        // },
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
          },
          addMore: '',
          addMoreBtn: '',
          addMoreFieldName: '',
          cancelBtn: '',
          saveAndCloseBtn: '',
          elements: [
            {
              type: 'textbox',
              label: 'Relative Email',
              binding: 'relative_email',
              vlidators: { required: 'Is required', email: 'Invalid email' },
            },
            {
              type: 'select',
              options: options,
              label: 'Select spouse',
              binding: 'Spouse',
            },
          ],
        },
      });
      chart.on('click', function (sender, args) {
        console.log(args.node.id, 'Clicked on Node');
        sender.editUI.show(args.node.id, false);
        return false;
      });
      chart.editUI.on('update', async function (sender, args) {
        console.log(args, 'args in button-click');
        if (args.name === 'submit') {
          var data = chart.get(args.nodeId);
          console.log(data, 'sasasas');
          var relativeEmailInputValue = document.querySelector(
            "input[data-binding='relative_email']"
          )?.value;
          const selectedSuposeId = document.querySelector(
            "[data-binding='Spouse']"
          )?.value;
          console.log(selectedSuposeId, 'selectedSuposeId');
          if (!relativeEmailInputValue)
            return Toastify({
              text: 'Please fill in this field',
              duration: 3000,
              position: 'center',
              style: {
                background: 'red',
              },
            }).showToast();
          console.log(relativeEmailInputValue, 'Typed Relative Email');
          const relativeType = determineRelativeType(data);
          const payload = {
            tree_id: treeId,
            user_id: user_id,
            relative_type: relativeType,
            relative_email: relativeEmailInputValue,
            api: 'abc.com',
          };
          if (data?.fid && data?.mid) {
            payload['relative_type'] = 'children';
            payload['spouse_id'] = selectedSuposeId;
          }
          console.log(payload, 'payload');
          var submitButton = document.querySelector('.submit-btn');
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
                text: 'Relative added successfully',
                duration: 3000,
                position: 'center',
                style: {
                  background: 'linear-gradient(to right, #00b09b, #96c93d)',
                },
              }).showToast();
              chart.removeNode(args.nodeId);
              console.time('child remove node');
            } else {
              console.error('Error while adding relative:', error);
              Toastify({
                text: 'Error while adding relative',
                duration: 3000,
                position: 'center',
                style: {
                  background: 'red',
                },
              }).showToast();
            }
          } catch (error) {
            console.error('Error while adding relative:', error);
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
            submitButton.classList.remove('loading');
          }
        }
      });
      // chart.on('updated', function (sender, args) {
      //   console.log(args, 'args in updated');
      //   if (args.addNodesData.length) {
      //     sender.editUI.show(args.addNodesData[0].id);
      //     chart.removeNode(args.addNodesData[0].id);
      //   }
      // });
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
        console.log(apiRetrievedData[j], 'apiRetrievedData[j]');
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
