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
  if (data.children && data.children.length > 0 && !data.parent)
    return 'parent';
  if (data.tags.includes('partner')) return 'spouse';
  if (data.parent) return 'children';
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
        zoom: 0.8,
        enableSearch: false,
        template: 'hugo',
        nodeTreeMenu: true,
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
      let lastClickedNodeData = null;
      let chartData = null;
      chart.on('click', function (sender, args) {
        // args.preventDefault();
        lastClickedNodeData = args.node;
        chartData = chart.get(args.node.id);
        // console.log(chartData, 'chartData');
        // console.log('Clicked on Node=>', lastClickedNodeData);
        sender.editUI.show(args.node.id, false);
        const spouseSelect = document.querySelector("[data-binding='Spouse']");
        const spouseLabel = spouseSelect
          ? spouseSelect.previousElementSibling
          : null;
        if (chartData && chartData.fid && chartData.mid && options.length > 0) {
          if (spouseSelect) spouseSelect.style.display = 'block';
          if (spouseLabel) spouseLabel.style.display = 'block';
        } else {
          if (spouseSelect) spouseSelect.style.display = 'none';
          if (spouseLabel) spouseLabel.style.display = 'none';
        }
        return false;
      });
      chart.editUI.on('button-click', async function (sender, args) {
        chart.removeNode(args.id);
        if (args.name === 'submit') {
          var data = chart.get(args.nodeId);
          // console.log(data, 'data in submit');

          console.log('data=>', data);
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
                background: 'linear-gradient(180deg, #dd464c, #8d2729)',
              },
            }).showToast();
          console.log(relativeEmailInputValue, 'Typed Relative Email');
          const relativeType = determineRelativeType(lastClickedNodeData);
          console.log('relativeType', relativeType);
          const payload = {
            tree_id: treeId,
            user_id: user_id,
            relative_type: relativeType,
            relative_email: relativeEmailInputValue,
            api: 'abc.com',
          };
          if (data.fid && data.mid) {
            payload['relative_type'] = 'children';
            payload['spouse_id'] = selectedSuposeId || null;
          }
          console.log('payload=>', payload);
          var submitButton = document.querySelector('.submit-btn');
          submitButton.classList.add('loading');
          try {
            const response = await fetch(
              'https://apinew.bridjus.com/tree/add-relative',
              // 'http://jsonplaceholder.typicode.com/posts',
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
              chart.removeNode(args.nodeId);
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
      for (i = 0; i < result.data.final_filter.length; i++) {
        apiRetrievedData.push({
          id: result.data.final_filter[i]?.id,
          pids: result.data.final_filter[i]?.pids,
          mid: result.data.final_filter[i]?.mid,
          name: result.data.final_filter[i].name,
          fid: result.data.final_filter[i].fid,
          img: result.data.final_filter[i].photo,
          gender: result.data.final_filter[i].gender.toLowerCase(),
          // gender: result.data.final_filter[i].gender,
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
